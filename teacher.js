const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const router = express.Router();
require("dotenv/config");
const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");
const { randomUUID } = require("crypto");
const axios = require("axios");
const FormData = require("form-data");
const userschema1 = require("./moduls/userModul");
const teacherModul = require("./moduls/teacherModul");
const cursModul = require("./moduls/cursModul");
const IsTeacherIn = require("./is/isTeacherin");
const IsAdminIn = require("./is/isadmin");
const sendEmail = require("./serves/Sendmessange");

router.use(express.json({ limit: "1000mb" }));
router.use(fileUpload());

const User = mongoose.model("User", userschema1);
const Curs = mongoose.model("Curs", cursModul);
const Teacher = mongoose.model("Teacher", teacherModul);

const TELEGRAM_SERVICE_URL = 'http://save.ilmlar.com/img-docs';

router.get("/teacher", async (req, res) => {
  try {
    const data = await Teacher.find({});
    res.send(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/teacher/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ username: req.body.username, isverify: true });

    if (!teacher) {
      return res.status(400).json({ message: "Noto'g'ri username yoki parol" });
    }

    const passwordMatch = await bcrypt.compare(password, teacher.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const token = jwt.sign({ teacherId: teacher.id }, process.env.ADMIN_hash, { expiresIn: 3600 * 60 * 60 });
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});

router.get("/teacherinfo/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select("fullname mekurs bio joylashuv path mutahasislik boglashlink obunachilar");
    if (!teacher) {
      return res.status(404).send("O'qituvchi topilmadi");
    }
    res.send(teacher);
  } catch (error) {
    res.status(500).send("Server xatosi: " + error);
  }
});

router.get("/teacherme", IsTeacherIn, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.teacherId);
    if (!teacher) {
      return res.status(404).send("O'qituvchi topilmadi");
    }
    res.send(teacher);
  } catch (error) {
    res.status(500).send("Server xatosi: " + error);
  }
});

router.get("/teacher-mycurs", IsTeacherIn, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher.teacherId).select("_id");
    if (!teacher) {
      return res.status(404).send("O'qituvchi topilmadi");
    }
    const curs = await Curs.find({ teacher_Id: teacher.id });
    res.send(curs);
  } catch (error) {
    res.status(500).send("Server xatosi: " + error);
  }
});

router.post("/teacher/register", async (req, res) => {
  try {
    if (!req.body.password || !req.body.email) {
      return res.send("password required");
    }

    const existingTeacher = await Teacher.findOne({ username: req.body.username, isverify: true });
    const existing1Teacher = await Teacher.findOne({ email: req.body.email, isverify: false });
    const existing2Teacher = await Teacher.findOne({ username: req.body.username, isverify: false });

    if (existing1Teacher || existing2Teacher) {
      await Teacher.deleteMany({ username: req.body.username, isverify: false });
      await Teacher.deleteMany({ email: req.body.email, isverify: false });
    }

    const { bio, mutahasislik, joylashuv, password, username, fullname, email, boglashlink } = req.body;
    const code = Math.floor(Math.random() * 10 ** 6);

    const emailResponse = await sendEmail(req.body.email, code);
    if (emailResponse == "xatolik") {
      return res.send("emailga kod yuborishda hatolik");
    }

    const hashpass = await bcrypt.hash(password, 10);
    let filePath = "";

    if (!existingTeacher) {
      const teacher = new Teacher({
        path: filePath,
        username,
        password: hashpass,
        hisob: 0,
        fullname,
        email,
        bio,
        obunachilar: [],
        mekurs: [],
        joylashuv,
        mutahasislik,
        boglashlink,
        sendEmailCode: code,
        isverify: false,
      });

      const savedTeacher = await teacher.save();
      res.send({ email: email });
    } else {
      res.send("bunday foydalanuvchi bor");
    }
  } catch (error) {
    console.log(error);
    res.status(501).send("Internal server error");
  }
});

router.post("/teacher/register/verify", async (req, res) => {
  const { code, email } = req.body;

  const existuser = await Teacher.findOne({ email, isverify: false });
  if (!existuser) {
    return res.status(404).send("bunday user yoq");
  }

  if (existuser.sendEmailCode == code) {
    existuser.isverify = true;
    await existuser.save();
    return res.send(existuser);
  } else {
    return res.status(404).send("kod xato");
  }
});

router.put("/teacher/", IsTeacherIn, async (req, res) => {
  try {
    const { bio, mutahasislik, joylashuv, username, fullname, boglashlink } = req.body;

    const teacher = await Teacher.findById(req.teacher.teacherId);
    teacher.bio = bio;
    teacher.mutahasislik = mutahasislik;
    teacher.joylashuv = joylashuv;
    teacher.fullname = fullname;
    teacher.boglashlink = boglashlink;

    if (username !== teacher.username) {
      const existingTeacher = await Teacher.findOne({ username: username });
      if (existingTeacher) {
        return res.send("bunday user mavjud");
      }
      teacher.username = username;
    }

    let image = "";

    if (req?.files?.file) {
      const { file } = req.files;
      const formData = new FormData();
      formData.append('file', file.data, file.name);

      try {
        const response = await axios.post(TELEGRAM_SERVICE_URL, formData, {
          headers: formData.getHeaders()
        });

        image = response.data.url; // Assuming your service returns a URL in the response
        teacher.path = image;
      } catch (err) {
        console.error('Error sending file to service:', err);
        return res.status(500).send('Failed to send file to service.');
      }
    }

    await teacher.save();
    res.send(teacher);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server xatosi: " + error);
  }
});

router.delete("/teacher/:id", IsAdminIn, async (req, res) => {
  try {
    const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!deletedTeacher) {
      return res.status(404).send("Teacher not found");
    }
    res.send(deletedTeacher);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
