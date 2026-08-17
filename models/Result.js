const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    courseCode: {
      type: String,
      required: true,
    },

    courseName: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    grade: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Passed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Result", resultSchema);
