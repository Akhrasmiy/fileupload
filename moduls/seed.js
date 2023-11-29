const mongoose = require("mongoose");
const userschema=require("./userModul")
const teacherschema=require("./teacherModul")
const courseschema=require("./cursModul");
const adminschema = require("./adminModul");
const User = mongoose.model("User", userschema);
const Curs = mongoose.model("Curs", courseschema);
const Teacher = mongoose.model("Teacher", teacherschema);
const Admin = mongoose.model("Admin", adminschema);
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
    await Admin.deleteMany({})
}
seedDB().then(()=>{
    mongoose.disconnect()
})
