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
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 * 1024 },
}));
// router.use(fileUpload({
//   limits: { fileSize: 50 * 1024 * 1024 * 1024 },
// }));

const User = mongoose.model('User', userschema1);
const Curs = mongoose.model('Curs', cursModul);
const Teacher = mongoose.model('Teacher', teacherModul)
router.get('/users', async (req, res) => {

  try {
    const data = await User.find({});
    res.send(data);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('Foydalanuvchi topilmadi');
    }
    res.send(user)
  } catch (error) {
    res.status(500).send("Server xatosi: " + error);
  }
});
router.post("/users/me", IsLoggedIn, async (req, res, next) => {

  const user = await User.findById(req.user.userId)
  res.send(user)
  next()
})
router.post("/users/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(400).json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(password)
    if (!passwordMatch) {
      return res.status(400).json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.ADMIN_hash,
      { expiresIn: 3600 * 60 * 60 }
    );
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});
router.post('/users/register', async (req, res, next) => {
  console.log(req.body)
  let filename = randomUUID()
  if(!req.files){
    return res.send("path maydon bosh bolishi mumkin emas")
  }
  const {file}=req.files
  
  const hashpass = await bcrypt.hash(req.body.password, 10)
  const student = await User.findOne({ username: req.body.username });
  if (student) {
    return res.send("bunday nomli foydalanuvchi bor")
  }
  
  let qoshimcha = file.name.split(".").at(-1)
  let a = path.join(__dirname, "/uploads", `${filename}.${qoshimcha}`)
  await file.mv(path.join(__dirname, "/uploads", `${filename}.${qoshimcha}`), (err) => {
    if (err) {
      console.log(err);
    }
  })

  try {
    const user = new User({
      username: req.body.username,
      path: a,
      password: hashpass,
      fullname: req.body.fullname,
      email: req.body.email,
      price: 0,
      savecurss: []
    });
    const savedUser = await user.save();
    res.send(savedUser);
    next()
  } catch (error) {
    res.status(500).send(error);
  }
});
router.put('/users/', IsLoggedIn, async (req, res, next) => {
  try {
    const id = req.user.userId;
    const { file } = req.files;
    const { username, fullname, email, password } = req.body;
    let hashpass = await bcrypt.hash(password, 10);
    const user = await User.findById(id);

    const exituser = await User.findOne({ username: username });
    if (exituser) {
      return res.send("bu nomdagi foydalanuvchi mavjud");
    }

    await file.mv(path.join(user.path));

    const updatedUser = await User.findByIdAndUpdate(id, {
      username,
      fullname,
      path: user.path,
      email,
      price: user.price,
      password: hashpass
    }, { new: true });

    res.send(updatedUser);
    next();
  } catch (error) {
    res.status(500).send(error);
  }
});
router.post('/baycurs', IsLoggedIn, async (req, res, next) => {
  const { cursId } = req.body
  let curs = await Curs.findById(cursId)
  if (!curs) {
    return res.send("bunday kurs mavjud emas")
  }
  if (curs.subs.includes(req.user.userId)) {
    return res.send("bu Kursni avval olgansiz");
  }
  let user = await User.findById(req.user.userId)
  console.log(user)
  let teacher = await Teacher.findById(curs.teacher_Id)
  if (user.price >= curs.narxi) {
    teacher.hisob += curs.narxi
    user.price -= curs.narxi
    curs.subs.push(req.user.userId)
    user.mycurs.push({
      qachongacha: Math.floor(Date.now() / 1000 + curs.muddati * 30 * 24 * 60 * 60),
      cursId: cursId
    })
    await user.save()
    await curs.save()
    await teacher.save()
    console.log(user, teacher, curs)
    res.send("muvaffaqqiyatli")
  }
  else {
    res.send("hisobingizni toldiring")
  }

  next()
})
router.post("/users/savecurs", IsLoggedIn, async (req, res) => {
  let user = await User.findById(req.user.userId)
  const curs=await Curs.findById(req.body.cursId)
  
  if(!curs){
    return res.send("bunday kurs mavjud emas")
  }
  if (user.savecurss.includes(req.body.cursId)) {
    user.savecurss.splice(user.savecurss.indexOf(req.body.cursId),1)
  }
  else {
    user.savecurss.push(req.body.cursId)
  }
  user.save()
  res.send(user)
})
router.post("/users/obuna", IsLoggedIn, async (req, res) => {
  let user = await User.findById(req.user.userId)
  const teacher=await Teacher.findById(req.body.teacher_Id)
  if(!teacher){
    return res.send("bunday teacher mavjud emas")
  }
  if (teacher.obunachilar.includes(req.body.teacher_Id)) {
    teacher.obunachilar.splice(teacher.obunachilar.indexOf(req.body.teacher_Id),1)
  }
  else {
    teacher.obunachilar.push(req.body.teacher_Id)
  }
  teacher.save()
  res.send(teacher.obunachilar)
})
router.get('/usersinfo/:id', async (req, res) =>{
  const user=await User.findById(req.params.id).select('fullname path')
  console.log(user)
  res.send(user)
})

router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, fullname, email, type, price } = req.body;
  const { file } = req.files
  const user = await User.findOne({ username: req.body.username });
  let a = path.join(user.path)
  await file.mv(path.join(user.path), (err) => {
    if (err) {
      console.log(err);
    }
  })
  try {
    const user = await User.findByIdAndUpdate(id, {
      username,
      fullname,
      path: a,
      email,
      type,
      price,
    }, { new: true });
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).send('User not found');
    }
    res.send(deletedUser);
  } catch (error) {
    res.status(500).send(error);
  }
});
module.exports = router;