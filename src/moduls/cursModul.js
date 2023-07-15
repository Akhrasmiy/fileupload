const mongoose = require('mongoose');
const cursschema = new mongoose.Schema({
    teacher_Id: {
        type: String,
        required: true,

    },
    Kursname: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    Kursdesc: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    narxi: {
        type: Number
    }
    ,
    subs: Array,
    muddati: Number,
    vedios: [{
        orni: String,
        nomi: String,
        desc: String
    }],
    obloshka:{
       type: String,
       required:true
        
    },
    Comments:[{
        userid:String,
        text:String
    }]
})
module.exports = cursschema