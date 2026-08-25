const express = require("express");
const Course = require("../models/Course");

const router = express.Router();

/* =========================
   GET ALL COURSES
========================= */
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ month: 1, code: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch courses.",
      error: error.message,
    });
  }
});

/* =========================
   GET COURSES BY MONTH
========================= */
router.get("/month/:month", async (req, res) => {
  try {
    const courses = await Course.find({
      month: Number(req.params.month),
    }).sort({ code: 1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch month courses.",
      error: error.message,
    });
  }
});

/* =========================
   GET SINGLE COURSE
========================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let course = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(id);
    }
    if (!course) {
      course = await Course.findOne({ code: id });
    }
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve course.", error: error.message });
  }
});

/* =========================
   CREATE COURSE (Admin)
========================= */
router.post("/", async (req, res) => {
  try {
    const { code, name, credits, month, progress, outline } = req.body;
    if (!code || !name || !credits || !month) {
      return res.status(400).json({
        message: "Course code, name, credits, and month are required.",
      });
    }

    const existing = await Course.findOne({ code: code.trim() });
    if (existing) {
      return res.status(409).json({ message: "Course code already exists." });
    }

    const course = await Course.create({
      code: code.trim(),
      name: name.trim(),
      credits: Number(credits),
      month: Number(month),
      progress: Number(progress) || 0,
      outline: outline || "",
    });

    res.status(201).json({ message: "Course created successfully.", course });
  } catch (error) {
    res.status(500).json({ message: "Failed to create course.", error: error.message });
  }
});

/* =========================
   UPDATE COURSE (Admin)
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let course = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    }
    if (!course) {
      course = await Course.findOneAndUpdate({ code: id }, req.body, { new: true, runValidators: true });
    }
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.json({ message: "Course updated successfully.", course });
  } catch (error) {
    res.status(500).json({ message: "Failed to update course.", error: error.message });
  }
});

/* =========================
   DELETE COURSE (Admin)
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let course = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findByIdAndDelete(id);
    }
    if (!course) {
      course = await Course.findOneAndDelete({ code: id });
    }
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    res.json({ message: "Course deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course.", error: error.message });
  }
});

module.exports = router;

