const express = require("express");
const Result = require("../models/Result");
const Student = require("../models/Student");

const router = express.Router();

/* =====================================================
   GET ALL RESULTS (Admin view / filter)
   GET /api/results
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { studentId, courseCode } = req.query;
    const filter = {};

    if (studentId) {
      filter.studentId = studentId.trim();
    }
    if (courseCode) {
      filter.courseCode = courseCode.trim();
    }

    const results = await Result.find(filter).sort({ createdAt: -1 });
    return res.json(results);
  } catch (error) {
    console.error("Get results error:", error);
    return res.status(500).json({
      message: "Failed to fetch results.",
      error: error.message,
    });
  }
});

/* =====================================================
   GET RESULTS FOR A STUDENT
   GET /api/results/student/:studentId or /api/results/:studentId
===================================================== */
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId.trim();

    const results = await Result.find({
      $or: [
        { studentId: studentId },
        { studentId: { $regex: new RegExp(`^${studentId}$`, "i") } },
      ],
    }).sort({ createdAt: -1 });

    return res.json(results);
  } catch (error) {
    console.error("Get student results error:", error);
    return res.status(500).json({
      message: "Failed to fetch student results.",
      error: error.message,
    });
  }
});

/* =====================================================
   GET SINGLE RESULT BY ID
   GET /api/results/:id (handles both MongoDB ObjectId and studentId fallback)
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let result = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      result = await Result.findById(id);
    }

    if (!result) {
      // If it's a studentId instead of result _id, return array of results
      const results = await Result.find({ studentId: id });
      if (results && results.length > 0) {
        return res.json(results);
      }
      return res.status(404).json({
        message: "Result not found.",
      });
    }

    return res.json(result);
  } catch (error) {
    console.error("Get result error:", error);
    return res.status(500).json({
      message: "Failed to retrieve result.",
      error: error.message,
    });
  }
});

/* =====================================================
   CREATE / SUBMIT RESULT (50% Assignment + 50% Exam)
   POST /api/results
===================================================== */
router.post("/", async (req, res) => {
  try {
    const {
      studentId,
      courseCode,
      courseName,
      assignmentScore,
      examScore,
      score, // backward compatibility
    } = req.body;

    if (!studentId || !courseCode || !courseName) {
      return res.status(400).json({
        message: "Student ID, course code, and course name are required.",
      });
    }

    const trimmedId = studentId.trim();

    // Assignment & Exam scores (0-100 scale)
    // If only 'score' is provided, treat it as examScore with 0 assignment, or default
    const aScore = assignmentScore !== undefined ? Number(assignmentScore) : 0;
    const eScore = examScore !== undefined ? Number(examScore) : (score !== undefined ? Number(score) : 0);

    // Calculate 50% Assignment + 50% Exam strictly on the backend!
    const { finalScore, grade, status } = Result.calculateResult(aScore, eScore);

    // Check if student exists
    const student = await Student.findOne({
      studentId: { $regex: new RegExp(`^${trimmedId}$`, "i") },
    });

    // Check if result already exists for this student & course
    let result = await Result.findOne({
      studentId: trimmedId,
      courseCode: courseCode.trim(),
    });

    if (result) {
      // Update existing result
      result.assignmentScore = aScore;
      result.examScore = eScore;
      result.finalScore = finalScore;
      result.grade = grade;
      result.status = status;
      result.courseName = courseName;
      if (student) result.studentRef = student._id;
      await result.save();
    } else {
      // Create new result
      result = await Result.create({
        studentId: trimmedId,
        studentRef: student ? student._id : undefined,
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        assignmentScore: aScore,
        examScore: eScore,
        finalScore,
        grade,
        status,
      });
    }

    // Update student's GPA if student exists
    if (student) {
      const allResults = await Result.find({ studentId: student.studentId });
      if (allResults.length > 0) {
        const avg = allResults.reduce((acc, r) => acc + r.finalScore, 0) / allResults.length;
        student.gpa = parseFloat((avg / 25).toFixed(2)); // GPA out of 4.0 scale approx
        await student.save();
      }
    }

    return res.status(201).json({
      message: "Result recorded successfully.",
      result,
    });
  } catch (error) {
    console.error("Create result error:", error);
    return res.status(500).json({
      message: "Failed to record result.",
      error: error.message,
    });
  }
});

/* =====================================================
   UPDATE RESULT (50% Assignment + 50% Exam recalculation)
   PUT /api/results/:id
===================================================== */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignmentScore, examScore, courseName } = req.body;

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        message: "Result not found.",
      });
    }

    const aScore = assignmentScore !== undefined ? Number(assignmentScore) : result.assignmentScore;
    const eScore = examScore !== undefined ? Number(examScore) : result.examScore;

    const { finalScore, grade, status } = Result.calculateResult(aScore, eScore);

    result.assignmentScore = aScore;
    result.examScore = eScore;
    result.finalScore = finalScore;
    result.grade = grade;
    result.status = status;
    if (courseName) result.courseName = courseName;

    await result.save();

    return res.json({
      message: "Result updated successfully.",
      result,
    });
  } catch (error) {
    console.error("Update result error:", error);
    return res.status(500).json({
      message: "Failed to update result.",
      error: error.message,
    });
  }
});

/* =====================================================
   DELETE RESULT
   DELETE /api/results/:id
===================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({
        message: "Result not found.",
      });
    }
    return res.json({
      message: "Result removed successfully.",
    });
  } catch (error) {
    console.error("Delete result error:", error);
    return res.status(500).json({
      message: "Failed to delete result.",
      error: error.message,
    });
  }
});

module.exports = router;

