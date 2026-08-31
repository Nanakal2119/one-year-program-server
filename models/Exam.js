const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (options) {
          return options.length === 4;
        },
        message: "Each question must have exactly 4 options.",
      },
    },

    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },

    points: {
      type: Number,
      default: 1,
    },
  },
  {
    _id: true,
  }
);

const examSchema = new mongoose.Schema(
  {
    /*
     * =========================
     * COURSE
     * =========================
     */

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

    /*
     * =========================
     * EXAM SETTINGS
     * =========================
     */

    date: {
      type: Date,
      default: Date.now,
    },

    duration: {
      type: Number,
      default: 60,
      min: 5,
      max: 300,
    },

    /*
     * =========================
     * QUESTIONS
     *
     * EVERY EXAM HAS EXACTLY
     * 50 QUESTIONS.
     * =========================
     */

    questions: {
      type: [questionSchema],
      default: [],

      validate: {
        validator: function (questions) {
          return (
            questions.length === 0 ||
            questions.length === 50
          );
        },
        message:
          "An exam must contain exactly 50 questions.",
      },
    },

    questionsReviewed: {
      type: Boolean,
      default: false,
    },

    /*
     * =========================
     * APPROVAL
     * =========================
     */

    approvalStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    /*
     * IMPORTANT:
     *
     * Even an approved exam is CLOSED
     * until the admin explicitly opens it.
     */

    isAvailable: {
      type: Boolean,
      default: false,
    },

    /*
     * =========================
     * ORIGINAL PDF
     * =========================
     */

    examPdf: {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      filename: {
        type: String,
        default: "",
      },

      contentType: {
        type: String,
        default: "application/pdf",
      },

      size: {
        type: Number,
        default: 0,
      },
    },

    /*
     * =========================
     * STUDENT OTP
     * =========================
     */

    otp: {
      code: {
        type: String,
        default: null,
      },

      expiresAt: {
        type: Date,
        default: null,
      },
    },

    /*
     * =========================
     * INVIGILATOR SUBMISSION
     * =========================
     */

    submissionPasswordHash: {
      type: String,
      default: null,
    },

    /*
     * =========================
     * SUBMISSION STATUS
     * =========================
     */

    submissionEnabled: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Exam",
  examSchema
);
