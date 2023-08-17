require("dotenv/config");
const express = require('express');
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
const IsClickIn = async(req, res, next) => {
   next()
}

module.exports= IsClickIn;