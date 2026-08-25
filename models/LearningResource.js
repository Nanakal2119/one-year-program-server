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

    type: {
      type: String,
      enum: ["video", "pdf", "document", "link", "other"],
      default: "video",
    },

    url: {
      type: String,
      default: "",
      trim: true,
    },

    videoUrl: {
      type: String,
      default: "",
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

    thumbnail: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedBy: {
      type: String,
      default: "Admin",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fallback for url / videoUrl
learningResourceSchema.pre("save", function (next) {
  if (!this.url && this.videoUrl) {
    this.url = this.videoUrl;
  }
  if (!this.videoUrl && this.url && this.type === "video") {
    this.videoUrl = this.url;
  }
  next();
});

module.exports =
  mongoose.models.LearningResource ||
  mongoose.model("LearningResource", learningResourceSchema);


