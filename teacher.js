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
    const teacher = await Teacher.findOne({ username: req.body.username });

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
    teacher.obunachilar = teacher.obunachilar.length;
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
    teacher.obunachilar = teacher.obunachilar.length;
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
    const existingTeacher = await Teacher.findOne({
      username: req.body.username,
    });
    console.log(existingTeacher);
    if (!req.body.password) {
      return res.send("password requard");
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
      });
      const savedTeacher = await teacher.save();
      res.send(savedTeacher);
    } else {
      res.send("bunday foydalanuvchi bor");
    }
  } catch (error) {
    console.log(error);
    res.status(501).send("Internal server error");
  }
});

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
      if (teacher.path == "") {
        const { file } = req.files;
        console.log(file)
        let qoshimcha = file.name.split(".").at(-1);
        image = path.join("/teacherPhoto", `${teacher._id}.${qoshimcha}`);
        await file.mv(
          path.join(__dirname, "/teacherPhoto", `${teacher._id}.${qoshimcha}`),
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );
        teacher.path = image;
      } else {
        await fs
          .unlink(path.join(__dirname, teacher.path), (err) => {
            if (err) {
              console.log(err);
            }
          })
          .then().catch(
          );
        const { file } = req.files;
        let qoshimcha = file.name.split(".").at(-1);
        let hoy = path.join("/teacher", `${teacher._id}.${qoshimcha}`);
        await file.mv(
          path.join(__dirname, "/uploads", `${teacher._id}.${qoshimcha}`),
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );
        image=hoy
        teacher.path = image;
      }
      await teacher.save();
      res.send(teacher);
    }
    else{
      teacher.path=""
    }
    await teacher.save();
    res.send(teacher);
  } catch (error) {
    
    throw new error("error")
    console.log(error);
  }
});

router.delete("/teacher/:id", async (req, res) => {
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
