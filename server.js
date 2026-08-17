const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const examRoutes = require("./routes/examRoutes");
const resultRoutes = require("./routes/resultRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const learningResourceRoutes = require("./routes/learningResourceRoutes");

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());
app.use(express.json());

/* =========================
   ROUTES
========================= */

app.use(
  "/api/registrations",
  registrationRoutes
);

app.use(
  "/api/students",
  studentRoutes
);

app.use(
  "/api/courses",
  courseRoutes
);

app.use(
  "/api/exams",
  examRoutes
);

app.use(
  "/api/results",
  resultRoutes
);

app.use(
  "/api/learning-resources",
  learningResourceRoutes
);

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "Student Portal API is running",
  });
});

/* =========================
   DATABASE CONNECTION
========================= */

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(process.env.MONGO_URI);

  isConnected = true;

  console.log("MongoDB connected successfully");
}

/* =========================
   VERCEL HANDLER
========================= */

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

module.exports = app;
