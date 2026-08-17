const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
    },

    christianName: {
      type: String,
    },

    age: {
      type: Number,
    },

    gender: {
      type: String,
    },

    birthDate: {
      type: Date,
    },

    workStatus: {
      type: String,
    },

    maritalStatus: {
      type: String,
    },

    hasChildren: {
      type: String,
    },

    address: {
      type: String,
    },

    hasConfessionFather: {
      type: String,
    },

    confessionFatherName: {
      type: String,
    },

    confessionFatherParish: {
      type: String,
    },

    status: {
      type: String,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);

