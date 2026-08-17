const express = require("express");
const Course = require("../models/Course");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ month: 1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/month/:month", async (req, res) => {
  try {
    const courses = await Course.find({
      month: Number(req.params.month),
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
