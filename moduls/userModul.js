const mongoose = require('mongoose');
const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 21,
  },
  tolovId:{
    type:String,
    required:true
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
    type: Number,
    required: true
  },
  teachers:Array,
  mycurs: [{
    cursId: String,
    qachongacha: Number,
    olinganVaqt: Number,
  }],
  savecurss: Array,
  isverify:{
    type:Boolean,
    default:false
  },
  sendEmail:{
    type:Number,
  }
})
module.exports = userschema