const jwt =require("jsonwebtoken");
const mongoose = require('mongoose');
const teacherModul=require("../moduls/teacherModul")
require("dotenv/config");

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */

const Teacher=mongoose.model('Teacher',teacherModul)
const IsFunkTeacherIn = async(req, res, next) => {
    try {
        const token = req.headers.authorization;
        const payload = jwt.verify(token, process.env.ADMIN_hash)
        req.teacher = { teacherId: payload.teacherId };
        console.log(payload)
        const teacher = await Teacher.findById(payload.teacherId);
        if (teacher) {
            req.teacher = { teacherId: payload.teacherId };
            next()
        }
        else{
            next()
        }
    } catch (error) {
        next()
    }
}

module.exports= IsFunkTeacherIn;