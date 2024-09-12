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
const FormData = require('form-data');
const { default: axios } = require("axios");

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
    const data = await Curs.find({ isfinished: true }).aggregate([
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
    const { name, vediosname, isOpen, vediosdesc, desc, narxi, muddati } = req.body;
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
      const folder = path.join(__dirname, "uploads");
      let cursobloshkarandom = randomUUID();
      let obqoshimcha = obloshka.name.split(".").at(-1);
      const location = path.join(
        folder,
        `${cursobloshkarandom}.${obqoshimcha}`
      );

      await fs.mkdir(folder, { recursive: true });

      let treelerorni = "";

      if (req.files.treeler) {
        let { treeler } = req.files;
        const treelerFormData = new FormData();
        treelerFormData.append('video', treeler.data, treeler.name);

        try {
          const treelerResponse = await axios.post('http://save.ilmlar.com/file', treelerFormData, {
            headers: {
              ...treelerFormData.getHeaders(),
            },
          });

          const treelerUUID = treelerResponse.data;
          treelerorni = `http://save.ilmlar.com/video?uuid=${treelerUUID}`;
        } catch (error) {
          console.error('Error uploading trailer:', error);
          return res.status(500).send('Failed to upload trailer.');
        }
      }

      await fs.writeFile(location, obloshka.data);

      console.log(vediosname.length);
      for (let i = 0; i < vediosname.length; i++) {
        let file = req.files.file[i];
        const formData = new FormData();
        formData.append('video', file.data, file.name);

        try {
          const response = await axios.post('http://save.ilmlar.com/file', formData, {
            headers: formData.getHeaders(),
          });

          const uuid = response.data;
          vedios.push({
            nomi: vediosname[i],
            desc: vediosdesc[i],
            orni: `http://save.ilmlar.com/video?uuid=${uuid}`,
            isOpen: isOpen[i],
          });
        } catch (error) {
          console.error('Error uploading file:', error);
          return res.status(500).send('Failed to upload file.');
        }
      }

      try {
        const curs = new Curs({
          Kursname: name,
          obloshka: path.join(
            "uploads/" + `${cursobloshkarandom}.${obqoshimcha}`
          ),
          teacher_Id: req.teacher.teacherId,
          Kursdesc: desc,
          narxi: narxi,
          subs: [],
          vedios: vedios,
          muddati: muddati,
          Comments: [],
          treeler: treelerorni,
          profit: 0,
        });

        const savedCurs = await curs.save();
        let oldteacher = await Teacher.findById(req.teacher.teacherId);
        oldteacher.mekurs.push(savedCurs.id);
        await oldteacher.save();
        res.send(savedCurs);
        next();
      } catch (error) {
        console.log(error);
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
      const user = await User.findById(req.user.userId);
      curs.Comments.push({
        userPath: user.path,
        username: user.fullname,
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
  const { name, vediosname, vediosdesc, desc, narxi, muddati, isOpen } =
    req.body;
  const curs = await Curs.findById(req.params.id);
  if (curs.teacher_Id == req.teacher.teacherId) {
    try {
      curs.Kursname = name;
      curs.Kursdesc = desc;
      curs.narxi = narxi;
      curs.muddati = muddati;
      let i = 0;
      curs.vedios.forEach((vedio) => {
        vedio.nomi = vediosname[i];
        vedio.desc = vediosdesc[i];
        if (isOpen[i] == "true" || isOpen[i] == "True") {
          isOpen[i] = true;
        } else {
          isOpen[i] = false;
        }

        i = i + 1;
      });
      await curs.save();
      res.send(curs);
    } catch (error) {
      res.send(curs).status(400);
    }
  } else {
    res.send("ruxsat yoq2");
  }
});

// v2 courses add for devid

router.post("/courses-create", IsTeacherIn, async (req, res, next) => {
  try {
    const { name, desc, narxi, muddati } = req.body;
    let vedios = [];
    if (!req.files.obloshka) {
      return res.status(500).send("obloshkani kirit");
    }
    let { obloshka } = req.files;

    let obloshkaURL = '';
    const obloshkaFormData = new FormData();
    obloshkaFormData.append('file', obloshka.data, obloshka.name);

    try {
      const obloshkaResponse = await axios.post('http://save.ilmlar.com/img-docs', obloshkaFormData, {
  headers: {
    ...obloshkaFormData.getHeaders(),
  },
});

      obloshkaURL = obloshkaResponse.data;
    } catch (error) {
      console.error('Error uploading obloshka:', error);
      return res.status(500).send('Failed to upload obloshka.');
    }

    let treelerorni = "";

    if (req.files.treeler) {
      let { treeler } = req.files;
      const treelerFormData = new FormData();
      treelerFormData.append('video', treeler.data, treeler.name);

      try {
        const treelerResponse = await axios.post('http://save.ilmlar.com/file', treelerFormData, {
          headers: {
            ...treelerFormData.getHeaders(),
          },
        });

        const treelerUUID = treelerResponse.data;
        treelerorni = `http://save.ilmlar.com/video?uuid=${treelerUUID}`;
      } catch (error) {
        console.error('Error uploading trailer:', error);
        return res.status(500).send('Failed to upload trailer.');
      }
    }

    try {
      const curs = new Curs({
        Kursname: name,
        obloshka: obloshkaURL,
        teacher_Id: req.teacher.teacherId,
        Kursdesc: desc,
        narxi: narxi,
        subs: [],
        vedios: vedios,
        muddati: muddati,
        Comments: [],
        isfinished: false,
        treeler: treelerorni,
        profit: 0,
      });

      const savedCurs = await curs.save();
      let oldteacher = await Teacher.findById(req.teacher.teacherId);
      oldteacher.mekurs.push(savedCurs.id);
      await oldteacher.save();
      res.send(savedCurs);
      next();
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});






router.post("/courses-divid/:id", IsTeacherIn, async (req, res, next) => {
  const id = req.params.id;
  const { videoName, videoDesc, isOpen } = req.body;
  const course = await Curs.findById(id);
  if (!course || course.teacher_Id !== req.teacher.teacherId || course.isfinished) {
    return res.status(400).send("error");
  }

  let file = req.files.videofile;
  const formData = new FormData();
  formData.append('video', file.data, file.name);

  try {
    const response = await axios.post('http://save.ilmlar.com/file', formData, {
      headers: formData.getHeaders(),
    });

    const uuid = response.data;
    course.vedios.push({
      nomi: videoName,
      desc: videoDesc,
      orni: `http://save.ilmlar.com/video?uuid=${uuid}`,
      isOpen: isOpen,
    });

    await course.save();
    res.send(course);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Failed to upload file.');
  }
});



router.get("/courses-finish/:id", IsTeacherIn, async (req, res, next) => {
  const id = req.params.id;
  const course = await Curs.find({ teacher_Id: req.teacher.teacherId, _id: id, isfinished: false })
  if (!course) {
    res.send(course._id)
  }
  else {
    const course = await Curs.find({ teacher_Id: req.teacher.teacherId, _id: id, isfinished: true })
    res.send(course.name)
  }
})
router.get("/whoisownerbycard/:cardNumber", async (req, res, next) => {
  try {
    const cardNumber = req.params.cardNumber;

    const username = 'ilmlarcom';
    const password = 'dEpSPx^LWnK79VhC(EKh-A]*P';
    const authString = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await axios.post('https://pay.myuzcard.uz/api/Credit/getCardOwnerInfoByPan',
      { cardNumber: cardNumber },
      { headers: { Authorization: `Basic ${authString}` } });

    console.log(response.data);
    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
});
router.post("/cridettotecher", async (req, res, next) => {
  try {
    const data = {
      "extraId": `test-extraId=${randomUUID()}`
    }

    const username = 'ilmlarcom';
    const password = 'dEpSPx^LWnK79VhC(EKh-A]*P';
    const authString = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await axios.post('https://pay.myuzcard.uz/api/Credit/Credit',
      { ...data,...req.body },
      { headers: { Authorization: `Basic ${authString}` } });

    console.log(response);
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
});

module.exports = router;
