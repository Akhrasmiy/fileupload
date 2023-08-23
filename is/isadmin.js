const jwt = require("jsonwebtoken");
require("dotenv/config");
const mongoose = require('mongoose');
const userschema1 = require('../../moduls/userModul');
const adminschema = require("../../moduls/adminModul");

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */

const Admin = mongoose.model('Admin', adminschema);

const IsAdminIn = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        const payload = jwt.verify(token, process.env.ADMIN_hash)
        const user = await Admin.findById(payload.adminId);
        if (user) {
            req.admin = { adminId: payload.adminId };
            console.log(payload)
            next()
        }
        else{
            res.status(401).json({
                message: "Ruxsatsiz",
                error,
            }) 
        }
    } catch (error) {
        res.status(401).json({
            message: "Ruxsatsiz",
            error,
        })
    }
}

module.exports = IsAdminIn;