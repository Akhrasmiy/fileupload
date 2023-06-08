const mongoose = require('mongoose');
const express = require('express');
const path = require("path")
const app = express();
const fileUpload = require("express-fileupload");
const { writeFile } = require('fs');
const fs = require('fs/promises')
const userRout = require("./users")
const cursRout = require("./courssRoutes")
const teacherRout =require('./teacher')
const fileRout=require('./file')
const cors=require('cors')
mongoose.connect('mongodb://127.0.0.1:27017/project', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(userRout);
app.use(fileRout);
app.use(teacherRout)
app.use(cursRout);
app.get("/userphoto/:name", async (req, res) => {
  let a = path.join(__dirname, "/uploads", `${req.params.username}.png`)
  if (!a) {
    a = path.join(__dirname, "/teacherPhoto", `${req.params.username}.png`)
  }
  res.sendFile(a)
})






app.listen(5000, () => console.log('Server is running on port 5000'));
