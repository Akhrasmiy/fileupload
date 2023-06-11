const mongoose = require('mongoose');
const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 21,
  },
  fullname: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  path: {
    type: String
  }
  ,
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    // required:true

  },
  price: {
    type: String,
    required: true
  },
  teachers:Array,
  mycurs: [{
    cursId: String,
    qachongacha: Number,
    olinganVaqt: Number,
  }],
  savecurss: Array
})
module.exports = userschema