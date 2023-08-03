require("dotenv/config");
const express = require('express');
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
const IsClickIn = async(req, res, next) => {
   if(req.headers.authorization==process.env.Click_pass){
    next()
   }
   else{
    res.sendStatus(401).send("bu token xato")
   }
}

module.exports= IsClickIn;