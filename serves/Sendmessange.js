const nodeMailer = require("nodemailer");
const { BadRequestError } = require("../shared/errors");

const sendEmail = async (email, password) => {
  const transporter = await nodeMailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    auth: {
      user: "infoilmlar@gmail.com",
      pass: "jjencvfzxixbqkoi",
    },
  });
  try {
    const info = await transporter.sendMail({
      from: "infoilmlar@gmail.com",
      to: email,
      subject: "tasdiqlash kodi",
      html: "<h1>${password}<h1>",
    });
    return info.messageId;
  } catch (error) {
    console.log(error);
    throw new BadRequestError("kod yuborishda hatolik");
  }
};

module.exports = sendEmail;