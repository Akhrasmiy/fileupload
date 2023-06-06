const mongoose = require('mongoose');
const express = require('express');
const path = require("path")
const bcrypt = require('bcrypt')
const router = express.Router();
// GET so'rovi
router.use(express.json())

router.post('/file', async (req, res) => {
  try {
    const curs = path.join(req.body.fileUrl)
    console.log(curs)
    res.sendFile(req.body.fileUrl);
  } catch (error) {
    res.status(401).send("bunday file mavjud emas");
  }
});
module.exports = router;