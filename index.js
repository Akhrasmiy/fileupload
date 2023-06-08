const mongoose = require('mongoose');
const express = require('express');
const path = require("path")
const app = express();
const helmet = require('helmet');
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
var corsOptions = {
  origin: 'http://localhost:5173/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));

app.use(userRout);
app.use(fileRout);
app.use(teacherRout)
app.use(cursRout);

app.use(helmet({
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));





app.listen(5000, () => console.log('Server is running on port 5000'));
