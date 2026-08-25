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
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    grandfatherName: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    /* =========================
       PERSONAL INFORMATION
    ========================= */
    christianName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      default: 20,
    },

    gender: {
      type: String,
      default: "ወንድ",
    },

    dateOfBirth: {
      type: Date,
      default: Date.now,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    /* =========================
       EMPLOYMENT & MARITAL STATUS
    ========================= */
    employmentStatus: {
      type: String,
      default: "ተማሪ",
      trim: true,
    },

    maritalStatus: {
      type: String,
      default: "ያላገባ",
      trim: true,
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

    /* =========================
       CONFESSOR INFORMATION (የንስሐ አባት)
    ========================= */
    hasConfessor: {
      type: String,
      default: "አይ",
      trim: true,
    },

    confessorName: {
      type: String,
      default: "",
      trim: true,
    },

    confessorLocation: {
      type: String,
      default: "",
      trim: true,
    },

    confessorParish: {
      type: String,
      default: "",
      trim: true,
    },

    /* =========================
       ACADEMIC INFORMATION
    ========================= */
    program: {
      type: String,
      default: "One-Year Program",
      trim: true,
    },

    level: {
      type: String,
      default: "First Year",
      trim: true,
    },

    entryYear: {
      type: String,
      default: "2019",
      trim: true,
    },

    currentMonth: {
      type: Number,
      default: 1,
      min: 1,
      max: 12,
    },

    gpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 4.0,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "graduated", "inactive"],
      default: "active",
      trim: true,
    },

    enrolledCourses: [
      {
        code: { type: String, trim: true },
        name: { type: String, trim: true },
        month: { type: Number, default: 1 },
        progress: { type: Number, default: 0 },
        score: { type: Number, default: null },
        grade: { type: String, default: null },
        status: { type: String, default: "In Progress" },
        enrolledAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-fill full name
studentSchema.pre("save", function (next) {
  if (!this.name || this.isModified("firstName") || this.isModified("fatherName") || this.isModified("grandfatherName")) {
    this.name = `${this.firstName || ""} ${this.fatherName || ""} ${this.grandfatherName || ""}`.trim();
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);