const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
    },

    courseName: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      default: 60,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);
