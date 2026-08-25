const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      default: "",
      trim: true,
    },

    fatherName: {
      type: String,
      default: "",
      trim: true,
    },

    lastName: {
      type: String,
      default: "",
      trim: true,
    },

    grandfatherName: {
      type: String,
      default: "",
      trim: true,
    },

    christianName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      default: "ወንድ",
    },

    birthDate: {
      type: Date,
      default: Date.now,
    },

    dateOfBirth: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    workStatus: {
      type: String,
      default: "ተማሪ",
      trim: true,
    },

    employmentStatus: {
      type: String,
      default: "ተማሪ",
      trim: true,
    },

    maritalStatus: {
      type: String,
      default: "ያላገባ",
    },

    hasChildren: {
      type: String,
      default: "",
      trim: true,
    },

    numberOfChildren: {
      type: Number,
      default: 0,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    hasConfessionFather: {
      type: String,
      default: "አይ",
    },

    hasConfessor: {
      type: String,
      default: "አይ",
    },

    confessionFatherName: {
      type: String,
      default: "",
      trim: true,
    },

    confessorName: {
      type: String,
      default: "",
      trim: true,
    },

    confessionFatherParish: {
      type: String,
      default: "",
      trim: true,
    },

    confessorParish: {
      type: String,
      default: "",
      trim: true,
    },

    confessorLocation: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      default: "approved",
      trim: true,
    },

    approvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Registration", registrationSchema);