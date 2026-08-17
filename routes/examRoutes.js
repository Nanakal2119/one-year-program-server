const express = require("express");
const Exam = require("../models/Exam");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ date: 1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/available", async (req, res) => {
  try {
    const exams = await Exam.find({
      isAvailable: true,
    });

    res.json(exams);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;