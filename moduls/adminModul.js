const mongoose = require('mongoose');
const adminschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    hisobi: {
        type: Number,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})
module.exports = adminschema