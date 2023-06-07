const mongoose = require('mongoose');
const express = require('express');
const path = require("path")
const bcrypt = require('bcrypt');
const teacherschema = require('./moduls/teacherModul');
const router = express.Router();
// GET so'rovi
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
  const {teacherId}=req.params
  res.send(path.join(__dirname+"/teacherPhoto/"+teacherId))
})
router.get("/uploads/:userId", async (req, res) => {
  const {userId}=req.params
  res.send(path.join(__dirname+"/uploads/"+userId))
})
module.exports = router;