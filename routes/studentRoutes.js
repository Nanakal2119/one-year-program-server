const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    /* =========================
       ACCOUNT INFORMATION
    ========================= */

    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    /* =========================
       PERSONAL INFORMATION
    ========================= */

    phone: {
      type: String,
      default: "",
    },

    christianName: {
      type: String,
      default: "",
    },

    age: {
      type: Number,
    },

    gender: {
      type: String,
      default: "",
    },

    birthDate: {
      type: Date,
    },

    workStatus: {
      type: String,
      default: "",
    },

    maritalStatus: {
      type: String,
      default: "",
    },

    hasChildren: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    hasConfessionFather: {
      type: String,
      default: "",
    },

    confessionFatherName: {
      type: String,
      default: "",
    },

    confessionFatherParish: {
      type: String,
      default: "",
    },

    /* =========================
       ACADEMIC INFORMATION
    ========================= */

    program: {
      type: String,
      default: "Computer Science",
    },

    level: {
      type: String,
      default: "Third Year",
    },

    entryYear: {
      type: String,
      default: "2026",
    },

    currentMonth: {
      type: Number,
      default: 1,
    },

    gpa: {
      type: Number,
      default: 0,
    },

    results: {
      type: Array,
      default: [],
    },

    /* =========================
       STATUS
    ========================= */

    status: {
      type: String,
      default: "active",
    },

    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Student",
  studentSchema
);
