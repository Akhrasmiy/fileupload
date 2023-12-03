const mongoose = require("mongoose");
const cursschema = new mongoose.Schema(
  {
    teacher_Id: {
      type: String,
      required: true,
    },
    Kursname: {
      type: String,
      required: true
    },
    Kursdesc: {
      type: String,
      required: true,
    },
    narxi: {
      type: Number,
    },
    subs: Array,
    muddati: Number,
    vedios: [
      {
        orni: String,
        nomi: String,
        desc: String,
        isOpen: { type: Boolean, default: false },
      },
    ],
    obloshka: {
      type: String,
      required: true,
    },
    Comments: [
      {
        userPath: String,
        username: String,
        text: String,
      },
    ],
    treeler: {
      type: String,
      required: false,
    },
    profit: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);
module.exports = cursschema;
