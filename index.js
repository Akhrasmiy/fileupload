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
const teacherRout = require('./teacher')
const fileRout = require('./file')
const cors = require('cors')
mongoose.connect('mongodb://127.0.0.1:27017/project', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));
// app.use(fileUpload({
//   limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
// }));
// app.use(cors())
app.use(userRout);
app.use(fileRout);
app.use(teacherRout)
app.use(cursRout);

// app.use(express.limit(1000000000000));




const server = app.listen(5001, () => console.log('Server is running on port 5001'));
server.timeout = 3000000;
