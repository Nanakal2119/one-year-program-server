const express = require("express");
const Exam = require("../models/Exam");
const Result = require("../models/Result");
const Student = require("../models/Student");

const router = express.Router();

/* =========================
   GET ALL EXAMS
========================= */
router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find().sort({ date: 1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch exams.",
      error: error.message,
    });
  }
});

/* =========================
   GET AVAILABLE EXAMS
========================= */
router.get("/available", async (req, res) => {
  try {
    const exams = await Exam.find({
      isAvailable: true,
    }).sort({ date: 1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch available exams.",
      error: error.message,
    });
  }
});

/* =========================
   GET SINGLE EXAM
========================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let exam = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      exam = await Exam.findById(id);
    }
    if (!exam) {
      exam = await Exam.findOne({ courseCode: id });
    }
    if (!exam) {
      return res.status(404).json({ message: "Exam not found." });
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch exam.", error: error.message });
  }
});

/* =========================
   CREATE EXAM (Admin)
========================= */
router.post("/", async (req, res) => {
  try {
    const { courseCode, courseName, date, duration, isAvailable, questions } = req.body;
    if (!courseCode || !courseName) {
      return res.status(400).json({
        message: "Course code and course name are required.",
      });
    }

    const exam = await Exam.create({
      courseCode: courseCode.trim(),
      courseName: courseName.trim(),
      date: date ? new Date(date) : new Date(),
      duration: Number(duration) || 60,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : false,
      questions: Array.isArray(questions) ? questions : [],
    });

    res.status(201).json({ message: "Exam created successfully.", exam });
  } catch (error) {
    res.status(500).json({ message: "Failed to create exam.", error: error.message });
  }
});

/* =========================
   UPDATE EXAM (Admin)
========================= */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let exam = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      exam = await Exam.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    }
    if (!exam) {
      exam = await Exam.findOneAndUpdate({ courseCode: id }, req.body, { new: true, runValidators: true });
    }
    if (!exam) {
      return res.status(404).json({ message: "Exam not found." });
    }
    res.json({ message: "Exam updated successfully.", exam });
  } catch (error) {
    res.status(500).json({ message: "Failed to update exam.", error: error.message });
  }
});

/* =========================
   SUBMIT EXAM
   POST /api/exams/:id/submit
========================= */
router.post("/:id/submit", async (req, res) => {
  try {
    const { studentId, answers, score } = req.body;
    const { id } = req.params;

    let exam = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      exam = await Exam.findById(id);
    }
    if (!exam) {
      exam = await Exam.findOne({ courseCode: id });
    }

    const examScore = score !== undefined ? Number(score) : 0;
    const courseCode = exam ? exam.courseCode : id;
    const courseName = exam ? exam.courseName : id;

    // Check if result exists
    let result = await Result.findOne({ studentId, courseCode });
    const currentAssignmentScore = result ? result.assignmentScore : 0;

    const { finalScore, grade, status } = Result.calculateResult(currentAssignmentScore, examScore);

    if (result) {
      result.examScore = examScore;
      result.finalScore = finalScore;
      result.grade = grade;
      result.status = status;
      await result.save();
    } else {
      result = await Result.create({
        studentId,
        courseCode,
        courseName,
        assignmentScore: 0,
        examScore,
        finalScore,
        grade,
        status,
      });
    }

    res.json({
      message: "Exam submitted successfully.",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit exam.", error: error.message });
  }
});

/* =========================
   DELETE EXAM (Admin)
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let exam = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      exam = await Exam.findByIdAndDelete(id);
    }
    if (!exam) {
      exam = await Exam.findOneAndDelete({ courseCode: id });
    }
    if (!exam) {
      return res.status(404).json({ message: "Exam not found." });
    }
    res.json({ message: "Exam deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete exam.", error: error.message });
  }
});

module.exports = router;