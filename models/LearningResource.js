const mongoose = require("mongoose");

const learningResourceSchema = new mongoose.Schema(
  {
    course: {
      type: String,
      required: true,
      trim: true,
    },

    month: {
      type: Number,
      required: true,
    },

    className: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    resourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LearningResource",
  learningResourceSchema
);

