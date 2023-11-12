const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const path = require("path");
const fileUpload = require("express-fileupload");
const { writeFile } = require("fs");
const fs = require("fs/promises");
const fss = require("fs-extra");
const { stringify } = require("querystring");
const { randomUUID } = require("crypto");
const cursschema = require("./moduls/cursModul");
const teacherschema = require("./moduls/teacherModul");
const IsTeacherIn = require("./is/isTeacherin");
const IsLoggedIn = require("./is/islogedin");
const userschema = require("./moduls/userModul");
// GET so'rovi
router.use(express.json());

const User = mongoose.model("User", userschema);
const Teacher = mongoose.model("Teacher", teacherschema);
const Curs = mongoose.model("Curs", cursschema);
router.get("/courses", async (req, res, next) => {
  const { q } = req.query;
  let query = {};

  if (q && q != "") {
    query = { Kursname: { $regex: q, $options: "i" } };
  }

  try {
    const data = await Curs.aggregate([
      { $match: query },
      { $sample: { size: 10 } },
      {
        $project: {
          Kursname: 1,
          narxi: 1,
          teacher_Id: 1,
          Kursdesc: 1,
          obloshka: 1,
        },
      },
    ]);

    res.send(data);
  } catch (error) {
    next(error);
  }
});
router.get("/courses/:id", IsLoggedIn, async (req, res, next) => {
  try {
    const curs = await Curs.findById(req.params.id);
    if (!curs) {
      return res.status(401).send("Kurs topilmadi");
    }
    const user = await User.findById(req.user.userId);
    for (let i = 0; i < user.mycurs.length; i++) {
      if (user.mycurs[i].cursId == req.params.id) {
        console.log(curs.subs.indexOf(user.id));
        console.log(user.mycurs[i].qachongacha < Date.now() / 1000);
        if (user.mycurs[i].qachongacha < Date.now() / 1000) {
          user.mycurs.splice(i, 1);
          curs.subs.splice(curs.subs.indexOf(user.id) - 1, 1);
          console.log(curs.subs);
          user.save();
          curs.save();
        }
      }
    }
    if (curs.subs.includes(req.user.userId)) {
      res.send(curs);
    } else {
      let abu = [];
      await curs.vedios.forEach((vedio) => {
        if (!vedio.isOpen) {
          vedio.orni = "";
          abu.push(vedio);
        } else {
          abu.push(vedio);
        }
      });
      res.send({
        _id: curs._id,
        teacherId: curs.teacher_Id,
        Kursname: curs.Kursname,
        Kursdesc: curs.Kursdesc,
        subs: curs.subs.length,
        narxi: curs.narxi,
        muddati: curs.muddati,
        Comment: curs.Comments,
        obloshka: curs.obloshka,
        treeler: curs.treeler,
        vedios: abu,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/courseone/me", IsTeacherIn, async (req, res) => {
  try {
    const curs = await Curs.findById(req.body.cursId);
    if (!curs) {
      return res.status(401).send("Kurs topilmadi");
    }
    if (curs.teacher_Id == req.teacher.teacherId) {
      res.send(curs);
    } else {
      res.send("bunaqa kurs qushmagansiz");
    }
  } catch (error) {
    res.send(error);
  }
});

router.post("/courses", IsTeacherIn, async (req, res, next) => {
  try {
    console.log(req.teacher.teacherId);
    const { name, vediosname, isOpen, vediosdesc, desc, narxi, muddati } =
      req.body;
    let vedios = [];
    let i = 0;
    let existingcurs = await Curs.findOne({
      teacher_Id: req.teacher.teacherId,
      Kursname: name,
    });
    if (existingcurs) {
      return res.status(500).send("bunday kursni avval qushgansiz");
    } else {
      if (!req.files.obloshka) {
        return res.status(500).send("obloshkani kirit");
      }
      let { obloshka } = req.files;
      const folder = path.join(
        __dirname,
        "courses",
        req.teacher.teacherId,
        name
      );
      let obqoshimcha = obloshka.name.split(".").at(-1);
      const location = path.join(folder, `obloshka.${obqoshimcha}`);
      let treelerqoshimcha = "";
      let treelerlocation = "";
      await fs.mkdir(folder, { recursive: true });

      if (req.files.treeler) {
        let { treeler } = req.files;
        treelerqoshimcha = treeler.name.split(".").at(-1);
        treelerlocation = path.join(folder, `treeler.${treelerqoshimcha}`);
        await fs.writeFile(treelerlocation, treeler.data);
      }

      await fs.writeFile(location, obloshka.data);
      console.log(vediosname.length);
      for (let i = 0; i < vediosname.length; i++) {
        let file = req.files.file[i];
        let qoshimcha = file.name.split(".").at(-1);
        let vediosRand = randomUUID();
        const location = path.join(folder, `${vediosRand}.${qoshimcha}`);
        console.log(location);
        vedios.push({
          nomi: vediosname[i],
          desc: vediosdesc[i],
          orni: path.join(
            "courses/" +
              req.teacher.teacherId +
              "/" +
              name +
              "/" +
              `${vediosRand}.${qoshimcha}`
          ),
          isOpen: isOpen[i],
        });
        await fs.mkdir(folder, { recursive: true });
        await fs.writeFile(location, file.data);
      }

      try {
        let treelerorni=""
        if(req.files.treeler){
           treelerorni= path.join(
                "courses/" +
                  req.teacher.teacherId +
                  "/" +
                  name +
                  "/" +
                  `treeler.${treelerqoshimcha}`
              )
        }
        
        const curs = new Curs({
          Kursname: name,
          obloshka: path.join(
            "courses/" +
              req.teacher.teacherId +
              "/" +
              name +
              "/" +
              `obloshka.${obqoshimcha}`
          ),
          teacher_Id: req.teacher.teacherId,
          Kursdesc: desc,
          narxi: narxi,
          subs: [],
          vedios: vedios,
          muddati: muddati,
          Comments: [],
          treeler: treelerorni,
        });

        const savedCurs = await curs.save();
        let oldteacher = await Teacher.findById(req.teacher.teacherId);
        oldteacher.mekurs.push(savedCurs.id);
        await oldteacher.save();
        res.send(savedCurs);
        next();
      } catch (error) {
        console.log(err);
        res.status(500).send(error);
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});
router.post("/courses/commint", IsLoggedIn, async (req, res, next) => {
  try {
    const { cursId } = req.body;
    const curs = await Curs.findById(cursId);
    console.log("b");
    if (curs.subs.includes(req.user.userId)) {
      curs.Comments.push({
        userid: req.user.userId,
        text: req.body.text,
      });
      curs.save();
      res.send(curs);
      next();
    } else {
      res.send("bu kursni sotib olmagansiz");
    }
  } catch (error) {
    res.send(error);
  }
});
router.put("/courses/:id", IsTeacherIn, async (req, res, next) => {
  const { name, vediosname, vediosdesc, desc, narxi, muddati,isOpen } = req.body;
  const curs = await Curs.findById(req.params.id);
  if (curs.teacher_Id == req.teacher.teacherId) {
    curs.Kursname=name
    curs.Kursdesc=desc
    curs.narxi=narxi
    curs.muddati=muddati
    let i=0
    curs.vedios.forEach(vedio => {
      vedio.nomi=vediosname[i]
      vedio.desc=vediosdesc[i]
      if(isOpen[i]=="true"||isOpen[i]=="True")
      {
        isOpen[i]=true
      }
      else{
        isOpen[i]=false
      }

      i=i+1
    });
    await curs.save()
    res.send(curs)
  } else {
    res.send("ruxsat yoq2");
  }
});
module.exports = router;
