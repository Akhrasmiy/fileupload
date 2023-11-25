const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const router = express.Router();
require("dotenv/config");
const IsLoggedIn = require("./is/islogedin");
const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");
const { writeFile } = require("fs");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");
const userschema1 = require("./moduls/userModul");
const teacherModul = require("./moduls/teacherModul");
const cursModul = require("./moduls/cursModul");
const IsAdminIn = require("./is/isadmin");
const adminschema = require("./moduls/adminModul");
const IsClickIn = require("./is/isClick");
const { error } = require("console");
// GET so'rov
router.use(express.json({ limit: "1000mb" }));
router.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 * 1024 * 1024 },
  })
);
// router.use(fileUpload({
//   limits: { fileSize: 50 * 1024 * 1024 * 1024 },
// }));

const User = mongoose.model("User", userschema1);
const Curs = mongoose.model("Curs", cursModul);
const Teacher = mongoose.model("Teacher", teacherModul);

async function idgenerate() {
  const id = Math.floor(Math.random() * 10 ** 8);
  const existId = await User.findOne({ tolovId: id });
  if (existId) {
    return idgenerate();
  }
  return id;
}

router.get("/users", async (req, res) => {
  try {
    const data = await User.find({});
    res.send(data);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("Foydalanuvchi topilmadi");
    }
    res.send(user);
  } catch (error) {
    res.status(500).send("Server xatosi: " + error);
  }
});
router.get("/usersme", IsLoggedIn, async (req, res, next) => {
  const user = await User.findById(req.user.userId);
  res.send(user);
  next();
});
router.post("/users/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(password);
    if (!passwordMatch) {
      return res
        .status(400)
        .json({ message: "Noto'g'ri elektron pochta yoki parol" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.ADMIN_hash, {
      expiresIn: 3600 * 60 * 60,
    });
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});
router.post("/users/register", async (req, res, next) => {
  console.log(req.body);
  let filename = randomUUID();
  let image=""
  const code=Math.floor(Math.random()*10**6)
  await User.updateMany({},{$set:{isverify:true}})
  return res.send("0")
  const hashpass = await bcrypt.hash(req.body.password, 10);
  const student = await User.findOne({ username: req.body.username ,isverify:true});
  if (student) {
    return res.send("bunday nomli foydalanuvchi bor");
  }

  try {
    const user = new User({
      username: req.body.username,
      path: image,
      password: hashpass,
      fullname: req.body.fullname,
      email: req.body.email,
      price: 0,
      savecurss: [],
      tolovId: await idgenerate(),
    });
    const savedUser = await user.save();
    res.send(savedUser);
    next();
  } catch (error) {
    res.status(500).send(error);
  }
});
router.put("/users/", IsLoggedIn, async (req, res, next) => {
  try {
    const id = req.user.userId;
    const { username, fullname } = req.body;
    const user = await User.findById(id);
    user.fullname = fullname;
    console.log(req.files);
    if (req?.files?.file) {
      console.log("a");
      if (user.path == "") {
        const { file } = req.files;
        let qoshimcha = file.name.split(".").at(-1);
        image = path.join("/uploads", `${user._id}.${qoshimcha}`);
        await file.mv(
          path.join(__dirname, "/uploads", `${user._id}.${qoshimcha}`),
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );
        user.path = image;
      } else {
        await fs
          .unlink(path.join(__dirname, user.path), (err) => {
            if (err) {
              console.log(err);
            }
          })
          .then();
          const { file } = req.files;
          let qoshimcha = file.name.split(".").at(-1);
          image = path.join("/uploads", `${user._id}.${qoshimcha}`);
          await file.mv(
            path.join(__dirname, "/uploads", `${user._id}.${qoshimcha}`),
            (err) => {
              if (err) {
                console.log(err);
              }
            }
          );
          user.path = image;
      }
    }
    if (username !== user.username) {
      let existuser = await User.findOne({ username: username });
      if (existuser) {
        return res.send("bunday foydalanuchi mavjud")
      }
      else {
        user.username = username;
      }
    }

    const updatedUser = await user.save();
    res.send(updatedUser);
    next();
  } catch (error) {
    res.status(500).send(error);
  }
});
router.post("/baycurs", IsLoggedIn, async (req, res, next) => {
  try {
    const { cursId } = req.body;
    let curs = await Curs.findById(cursId);
    if (!curs) {
      return res.send("bunday kurs mavjud emas");
    }
    let admin = await Admin.findOne({});
    console.log(admin);
    if (curs.subs.includes(req.user.userId)) {
      return res.send("bu Kursni avval olgansiz");
    }
    let user = await User.findById(req.user.userId);
    console.log(user);
    let teacher = await Teacher.findById(curs.teacher_Id);

    if (user.price >= curs.narxi) {
      user.price = Number(user.price) - Number(curs.narxi);
      teacher.hisob = Number(teacher.hisob) + Number(curs.narxi) * 0.8;
      admin.hisobi = Number(admin.hisobi) + Number(curs.narxi) * 0.2;
      curs.subs.push(req.user.userId);
      user.mycurs.push({
        qachongacha: Math.floor(
          Date.now() / 1000 + curs.muddati * 30 * 24 * 60 * 60
        ),
        cursId: cursId,
      });
      await user.save();
      await admin.save();
      await curs.save();
      await teacher.save();
      console.log(user, teacher, curs);
      res.send("muvaffaqqiyatli");
    } else {
      res.send("hisobingizni toldiring");
    }

    next();
  } catch (error) {
    res.send(error);
  }
});
router.post("/users/savecurs", IsLoggedIn, async (req, res) => {
  let user = await User.findById(req.user.userId);
  const curs = await Curs.findById(req.body.cursId);

  if (!curs) {
    return res.send("bunday kurs mavjud emas");
  }
  if (user.savecurss.includes(req.body.cursId)) {
    user.savecurss.splice(user.savecurss.indexOf(req.body.cursId), 1);
  } else {
    user.savecurss.push(req.body.cursId);
  }
  user.save();
  res.send(user);
});
router.post("/users/obuna", IsLoggedIn, async (req, res) => {
  let user = await User.findById(req.user.userId);
  const teacher = await Teacher.findById(req.body.teacher_Id);
  if (!teacher) {
    return res.send("bunday teacher mavjud emas");
  }
  if (teacher.obunachilar.includes(user.id)) {
    teacher.obunachilar.splice(
      teacher.obunachilar.indexOf(user.id),1
    );
    user.teachers.splice(user.teachers.indexOf(req.body.teacher_Id), 1);
  } else {
    teacher.obunachilar.push(user.id);
    user.teachers.push(req.body.teacher_Id);
  }
  user.save();
  teacher.save();
  res.send(user.teachers);
});
router.get("/usersinfo/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("fullname path");
  console.log(user);
  res.send(user);
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, fullname, email, type, price } = req.body;
  const { file } = req.files;
  const user = await User.findOne({ username: req.body.username });
  let a = path.join(user.path);
  await file.mv(path.join(user.path), (err) => {
    if (err) {
      console.log(err);
    }
  });
  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        username,
        fullname,
        path: a,
        email,
        type,
        price,
      },
      { new: true }
    );
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.delete("/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).send("User not found");
    }
    res.send(deletedUser);
  } catch (error) {
    res.status(500).send(error);
  }
});

const Admin = mongoose.model("Admin", adminschema);
router.post("/users/tolov", IsAdminIn, async (req, res) => {
  try {
    console.log(req.admin);

    let user = await User.findById(req.body.userId);

    console.log(user.price);
    user.price = user.price + req.body.pul_miqdori;
    user.save();
    res.send(user);
  } catch (error) {
    res.send("error");
  }
});
router.post("/click/verify", async (req, res) => {
  try {
    const userId = req.body.merchant_trans_id;
    console.log(userId);
    let user = await User.findOne({ tolovId: userId });
    console.log(user);

    if (!user) {
      res.send({
        click_trans_id: req.body.click_trans_id,
        merchant_trans_id: req.body.merchant_trans_id,
        merchant_prepare_id: req.body.merchant_trans_id,
        error: -5,
        error_note: "User does not exist",
      });
    } else {
      res.send({
        click_trans_id: req.body.click_trans_id,
        merchant_trans_id: req.body.merchant_trans_id,
        merchant_prepare_id: req.body.merchant_trans_id,
        error: 0,
        error_note: "Success",
      });
    }
  } catch (error) {
    res.send(error);
  }
});
router.post("/click/tolov", async (req, res) => {
  try {
    const userId = req.body.merchant_trans_id;
    console.log(userId);
    let user = await User.findOne({ tolovId: userId });
    console.log(user);
    if (!user) {
      res.send({
        click_trans_id: req.body.click_trans_id,
        merchant_trans_id: req.body.merchant_trans_id,
        merchant_prepare_id: req.body.merchant_trans_id,
        error: -5,
        error_note: "User does not exist",
      });
    }
    console.log(req.body.amount);
    user.price = user.price + Number(req.body.amount);

    user.save();
    res.send({
      click_trans_id: req.body.click_trans_id,
      merchant_trans_id: req.body.merchant_trans_id,
      merchant_prepare_id: req.body.merchant_trans_id,
      error: 0,
      error_note: "Success",
    });
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
module.exports = router;
