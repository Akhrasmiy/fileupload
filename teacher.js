const mongoose = require('mongoose');
const express = require('express');
const path = require("path")
const bcrypt = require('bcrypt')
const router = express.Router();
require("dotenv/config")
const IsLoggedIn = require("./is/islogedin");
const jwt = require("jsonwebtoken")
const fileUpload = require("express-fileupload");
const { writeFile } = require('fs');
const fs = require('fs/promises');
const { randomUUID } = require('crypto');
const userschema1 = require('./moduls/userModul');
const teacherModul = require("./moduls/teacherModul")
const cursModul = require("./moduls/cursModul")
// GET so'rovi
router.use(express.json())

const User = mongoose.model('User', userschema1);
const Curs = mongoose.model('Curs', cursModul);
const Teacher = mongoose.model('Teacher', teacherModul)


router.get('/teacher', async (req, res) => {
  try {
    const page = 1; // Ochilgan sahifa raqami
    const perPage = 10; // Sahifadagi elementlar soni

    const data = await Teacher.find({}) // Tasodifiy tartibda belgilangan sahifadagi 10 ta o'qituvchi ma'lumotlarini chiqaradi
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
    console.log(password)
    if (!passwordMatch) {
      return res.status(400).json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const token = jwt.sign(
      { teacherId: teacher.id },
      process.env.ADMIN_hash,
      { expiresIn: 3600 * 60 * 60 }
    );
    console.log(token)
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});
router.get('/teacherinfo/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('fullname path boglashlink obunachilar');
    if (!teacher) {
      return res.status(404).send('O\'qituvchi topilmadi');
    }
    teacher.obunachilar = teacher.obunachilar.length
    res.send(teacher);
  } catch (error) {
    res.status(500).send("Server xatosi: " + error);
  }
});

router.post('/teacher/register', async (req, res) => {
  try {
    const existingTeacher = await Teacher.findOne({ username: req.body.username });
    console.log(existingTeacher)
    if (!req.body.password || !req.files) {
      return res.send("password and file requart")
    }
    const { bio, mutahasislik, joylashuv, password, username, fullname, email, boglashlink } = req.body;
    const hashpass = await bcrypt.hash(password, 10)

    if (!existingTeacher) {
      const { file } = req.files;

      let filename = randomUUID()
      let qoshimcha = file.name.split(".").at(-1)
      const filePath = path.join(__dirname, "/teacherPhoto", `${filename}.${qoshimcha}`);
      await file.mv(filePath);

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
        boglashlink
      });
      const savedTeacher = await teacher.save();
      res.send(savedTeacher);
    }
    else {
      res.send("bunday foydalanuvchi bor")
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

router.put('/teacher/:id', async (req, res) => {
  const { id } = req.params;
  const { username, fullname, email, type, price } = req.body;
  const { file } = req.files;
  let a = path.join(__dirname, "/teacherPhoto", `${req.body.username}.png`);
  await file.mv(path.join(__dirname, "/teacherPhoto", `${req.body.username}.png`), (err) => {
    if (err) {
      console.log(err);
    }
  });

  try {
    const teacher = await Teacher.findByIdAndUpdate(id, {
      username,
      path: a,
      fullname,
      email,
      type,
      price,
    }, { new: true });
    res.send(teacher);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/teacher/:id', async (req, res) => {
  try {
    const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!deletedTeacher) {
      return res.status(404).send('Teacher not found');
    }
    res.send(deletedTeacher);
  } catch (error) {
    res.status(500).send(error);
  }
});



module.exports = router;