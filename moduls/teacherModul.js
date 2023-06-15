const mongoose = require('mongoose');
const teacherschema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 21,
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    path: {
      type: String,
    },
    fullname: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 21,
    },
    email: {
      type: String,
      required: true,
    },
    hisob: {
      type: Number,
      required: true
    },
    mekurs: [String],
    obunachilar: Array,
    mutahasislik: {
      type: String
    },
    bio: {
      type: String
    },
    joylashuv: {
      type: String
    },
    boglashlink: {
      type: String
    },
  });
  module.exports =teacherschema