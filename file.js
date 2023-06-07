const mongoose = require('mongoose');
const express = require('express');
const jwt = require("jsonwebtoken")
const path = require("path")
const bcrypt = require('bcrypt');
const adminschema = require('./moduls/adminModul');
const teacherschema = require('./moduls/teacherModul');
const IsAdminIn = require('./is/isadmin');
const router = express.Router();
// GET so'rovi
const Admin = mongoose.model('Admin', adminschema);

router.use(express.json())

router.get('/courses/:teacherId/:cursId/:fileUrl', async (req, res) => {
  try {
    const { teacherId, cursId, fileUrl } = req.params
    let a = (path.join(__dirname + '/courses/' + teacherId + "/" + cursId + "/" + fileUrl))
    console.log(a)
    res.sendFile(a);
  } catch (error) {
    res.status(401).send("bunday file mavjud emas");
  }
});
router.get("/teacherPhoto/:teacherId", async (req, res) => {
  const { teacherId } = req.params
  res.send(path.join(__dirname + "/teacherPhoto/" + teacherId))
})
router.get("/uploads/:userId", async (req, res) => {
  const { userId } = req.params
  res.send(path.join(__dirname + "/uploads/" + userId))
})
router.post('/admin/register', async (req, res, next) => {
  const { username, password } = req.body
  if (!password) {
    return res.send("password required")
  }
  const user = await Admin.findOne({})
  if (user) {
    return res.send("admin mavjud")
  }
  else {
    try {
      const curs = new Admin({
        name: req.body.name,
        hisobi: 0,
        username: username,
        password: bcrypt.hashSync(password, 10)
      });
      const savedCurs = await curs.save();
      res.send(savedCurs)
    } catch (error) {
      res.send(error)
    }

  }

  next()
});
router.post("/admin/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username: req.body.username });

    if (!admin) {
      return res.status(400).json({ message: "Noto'g'ri username yoki parol" });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    console.log(password)
    if (!passwordMatch) {
      return res.status(400).json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const token = jwt.sign(
      { adminId: admin.id },
      process.env.ADMIN_hash,
      { expiresIn: 3600 * 60 * 60 }
    );
    console.log(token)
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});
router.get("/admin/hisob",IsAdminIn, async (req, res, next) => {
  let admin =await Admin.findOne({}).select('hisobi')
  res.send(admin)
});
module.exports = router;