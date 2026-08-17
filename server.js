const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();


const studentRoutes =
  require("./routes/studentRoutes");

const courseRoutes =
  require("./routes/courseRoutes");

const examRoutes =
  require("./routes/examRoutes");

const resultRoutes =
  require("./routes/resultRoutes");

const registrationRoutes =
  require("./routes/registrationRoutes");

const learningResourceRoutes =
  require("./routes/learningResourceRoutes");


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
    message:
      "Student Portal API is running",
  });

});


/* =========================
   DATABASE + SERVER
========================= */

const PORT =
  process.env.PORT || 5000;


const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();