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

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    isConnected = true;

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    throw error;
  }
};

/* =========================
   VERCEL SERVERLESS HANDLER
========================= */

const handler = async (req, res) => {
  try {
    await connectDB();

    return app(req, res);
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = handler;

