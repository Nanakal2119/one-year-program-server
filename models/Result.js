const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    studentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },

    courseCode: {
      type: String,
      required: true,
      trim: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    assignmentScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },

    examScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },

    finalScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },

    grade: {
      type: String,
      required: true,
      default: "F",
      trim: true,
    },

    status: {
      type: String,
      default: "Passed",
      enum: ["Passed", "Failed"],
    },
  },
  {
    timestamps: true,
  }
);

// Helper function to calculate grade and status
resultSchema.statics.calculateResult = function (assignmentScore, examScore) {
  const assignment = Number(assignmentScore) || 0;
  const exam = Number(examScore) || 0;
  
  // Formula: Assignment = 50%, Exam = 50%
  const finalScore = Math.round((assignment * 0.5) + (exam * 0.5));
  
  let grade = "F";
  if (finalScore >= 95) grade = "A+";
  else if (finalScore >= 85) grade = "A";
  else if (finalScore >= 80) grade = "A-";
  else if (finalScore >= 75) grade = "B+";
  else if (finalScore >= 70) grade = "B";
  else if (finalScore >= 65) grade = "B-";
  else if (finalScore >= 60) grade = "C+";
  else if (finalScore >= 50) grade = "C";
  else grade = "F";

  const status = finalScore >= 50 ? "Passed" : "Failed";

  return { finalScore, grade, status };
};

module.exports = mongoose.models.Result || mongoose.model("Result", resultSchema);

