const jwt = require("jsonwebtoken");
require("dotenv/config");
const mongoose = require('mongoose');
const userschema1 = require('../moduls/userModul');

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */

const User = mongoose.model('User', userschema1);

const IsLoggedIn = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        const payload = jwt.verify(token, process.env.ADMIN_hash)
        const user = await User.findById(payload.userId);
        if (user) {
            req.user = { userId: payload.userId };
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

module.exports = IsLoggedIn;