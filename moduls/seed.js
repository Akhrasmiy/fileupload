const mongoose = require("mongoose");
const userschema=require("./userModul")
const teacherschema=require("./teacherModul")
const courseschema=require("./cursModul")
const User = mongoose.model("User", userschema);
const Curs = mongoose.model("Curs", courseschema);
const Teacher = mongoose.model("Teacher", teacherschema);

mongoose
  .connect("mongodb://127.0.0.1:27017/project", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB ga ulandi.");
  })
  .catch((err) => {
    console.log("DB da xatolik: ", err);
  });

const seedDB=async()=>{
    await User.deleteMany({})
    await Teacher.deleteMany({})
    await Curs.deleteMany({})
}
seedDB().then(()=>{
    mongoose.disconnect()
})
