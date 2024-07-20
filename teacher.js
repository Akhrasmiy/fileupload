const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const router = express.Router();
require("dotenv/config");
const IsLoggedIn = require("./is/islogedin");
const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");
const { writeFile } = require("fs");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");
const userschema1 = require("./moduls/userModul");
const teacherModul = require("./moduls/teacherModul");
const cursModul = require("./moduls/cursModul");
const IsTeacherIn = require("./is/isTeacherin");
const { exists } = require("fs-extra");
const IsAdminIn = require("./is/isadmin");
const sendEmail = require("./serves/Sendmessange");
const { default: axios } = require("axios");
const FormData = require("form-data");
// GET so'rovi
router.use(express.json({ limit: "1000mb" }));

const User = mongoose.model("User", userschema1);
const Curs = mongoose.model("Curs", cursModul);
const Teacher = mongoose.model("Teacher", teacherModul);

router.get("/teacher", async (req, res) => {
  try {
    const page = 1; // Ochilgan sahifa raqami
    const perPage = 10; // Sahifadagi elementlar soni

    const data = await Teacher.find({}); // Tasodifiy tartibda belgilangan sahifadagi 10 ta o'qituvchi ma'lumotlarini chiqaradi
    res.send(data);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.post("/teacher/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ username: req.body.username ,isverify:true });

    if (!teacher) {
      return res.status(400).json({ message: "Noto'g'ri username yoki parol" });
    }

    const passwordMatch = await bcrypt.compare(password, teacher.password);
    console.log(password);
    if (!passwordMatch) {
      return res
        .status(400)
        .json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const token = jwt.sign({ teacherId: teacher.id }, process.env.ADMIN_hash, {
      expiresIn: 3600 * 60 * 60,
    });
    console.log(token);
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});
router.get("/teacherinfo/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select(
      "fullname mekurs bio joylashuv path mutahasislik boglashlink obunachilar"
    );
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
      return res.send("password requard");
    }
    const existingTeacher = await Teacher.findOne({
      username: req.body.username,
      isverify: true,
    });
    const existing1Teacher = await Teacher.findOne({
      email: req.body.email,
      isverify: false,
    });
    const existing2Teacher = await Teacher.findOne({
      username: req.body.username,
      isverify: false,
    });
    if (existing1Teacher || existing2Teacher) {
      await Teacher.deleteMany({
        username: req.body.username,
        isverify: false,
      });
      await Teacher.deleteMany({ email: req.body.email, isverify: false });
    }

    const {
      bio,
      mutahasislik,
      joylashuv,
      password,
      username,
      fullname,
      email,
      boglashlink,
    } = req.body;
    const code = Math.floor(Math.random() * 10 ** 6);

    const b = await sendEmail(req.body.email, code);
    if (b == "xatolik") {
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
  const {code,email}=req.body

    const existuser=await Teacher.findOne({email:email,isverify:false})
    if(!existuser){
      res.sendStatus(404)("bunday user yoq")
    }
    console.log(code,existuser.sendEmailCode);

    if(existuser.sendEmailCode==code){
      existuser.isverify=true
      existuser.save()
      return res.send(existuser)

    }
    else{
      return res.send("kod xato").status(404)
    }
})

router.put("/teacher/", IsTeacherIn, async (req, res) => {
  try {
    const { bio, mutahasislik, joylashuv, username, fullname, boglashlink } =
      req.body;

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
      console.log("a");
      if (req?.files?.file) {
        const { file } = req.files;
        const formData = new FormData();
        formData.append('file', file.data, file.name);
  
        try {
          const response = await axios.post('http://save.ilmlar.com/img-docs', formData, {
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
    }
    else{
    }
    await teacher.save();
    res.send(teacher);
  } catch (error) {
    
    throw new error("error")
    console.log(error);
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
