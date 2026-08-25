const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Result = require("../models/Result");
const { verifyToken, verifyAdmin, JWT_SECRET } = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   STUDENT LOGIN
   POST /api/students/login & /api/auth/student/login
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({
        message: "Student ID and password are required.",
      });
    }

    const trimmedId = studentId.trim();

    // Find student by studentId (case-insensitive search)
    const student = await Student.findOne({
      studentId: { $regex: new RegExp(`^${trimmedId}$`, "i") },
    });

    if (!student) {
      return res.status(401).json({
        message: "Invalid Student ID or password.",
      });
    }

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Student ID or password.",
      });
    }

    if (student.status === "suspended") {
      return res.status(403).json({
        message: "Your student account is suspended. Please contact the administrator.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: student._id,
        studentId: student.studentId,
        role: student.role || "student",
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Fetch student's course results
    const results = await Result.find({ studentId: student.studentId }).sort({ createdAt: -1 });

    return res.json({
      message: "Login successful.",
      token,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name || `${student.firstName} ${student.fatherName}`,
        firstName: student.firstName,
        fatherName: student.fatherName,
        grandfatherName: student.grandfatherName,
        christianName: student.christianName,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        employmentStatus: student.employmentStatus,
        maritalStatus: student.maritalStatus,
        hasChildren: student.hasChildren,
        numberOfChildren: student.numberOfChildren,
        hasConfessor: student.hasConfessor,
        confessorName: student.confessorName,
        confessorLocation: student.confessorLocation,
        confessorParish: student.confessorParish,
        program: student.program,
        level: student.level,
        entryYear: student.entryYear,
        currentMonth: student.currentMonth,
        gpa: student.gpa,
        status: student.status,
        results: results || [],
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({
      message: "Server error during login. Please try again.",
      error: error.message,
    });
  }
});

/* =====================================================
   AUTHENTICATED STUDENT PROFILE
   GET /api/students/profile
===================================================== */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Student record not found.",
      });
    }

    const results = await Result.find({ studentId: student.studentId }).sort({ createdAt: -1 });

    return res.json({
      ...student.toObject(),
      results: results || [],
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({
      message: "Failed to fetch student profile.",
      error: error.message,
    });
  }
});

/* =====================================================
   UPDATE OWN PROFILE
   PUT /api/students/profile
===================================================== */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { phone, password, address, confessorName, confessorLocation, confessorParish } = req.body;

    const updates = {};
    if (phone) updates.phone = phone.trim();
    if (address) updates.address = address.trim();
    if (confessorName !== undefined) updates.confessorName = confessorName;
    if (confessorLocation !== undefined) updates.confessorLocation = confessorLocation;
    if (confessorParish !== undefined) updates.confessorParish = confessorParish;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters.",
        });
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    const student = await Student.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.json({
      message: "Profile updated successfully.",
      student,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Failed to update profile.",
      error: error.message,
    });
  }
});

/* =====================================================
   GET ALL STUDENTS (Admin & Directory)
   GET /api/students
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { search, month, status } = req.query;
    const filter = {};

    if (month) {
      filter.currentMonth = Number(month);
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { studentId: searchRegex },
        { name: searchRegex },
        { firstName: searchRegex },
        { fatherName: searchRegex },
        { christianName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const students = await Student.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json(students);
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({
      message: "Failed to load students.",
      error: error.message,
    });
  }
});

/* =====================================================
   GET SINGLE STUDENT
   GET /api/students/:id
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let student = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findById(id).select("-password");
    }

    if (!student) {
      student = await Student.findOne({ studentId: id }).select("-password");
    }

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const results = await Result.find({ studentId: student.studentId });

    return res.json({
      ...student.toObject(),
      results: results || [],
    });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({
      message: "Failed to retrieve student.",
      error: error.message,
    });
  }
});

/* =====================================================
   UPDATE STUDENT (Admin)
   PUT /api/students/:id
===================================================== */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Hash password if admin is updating it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    let student = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");
    }

    if (!student) {
      student = await Student.findOneAndUpdate(
        { studentId: id },
        updateData,
        { new: true, runValidators: true }
      ).select("-password");
    }

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    return res.json({
      message: "Student updated successfully.",
      student,
    });
  } catch (error) {
    console.error("Update student error:", error);
    return res.status(500).json({
      message: "Failed to update student.",
      error: error.message,
    });
  }
});

/* =====================================================
   DELETE STUDENT (Admin)
   DELETE /api/students/:id
===================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let student = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      student = await Student.findByIdAndDelete(id);
    }

    if (!student) {
      student = await Student.findOneAndDelete({ studentId: id });
    }

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    // Clean up results for this student
    await Result.deleteMany({ studentId: student.studentId });

    return res.json({
      message: "Student and associated records removed successfully.",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({
      message: "Failed to delete student.",
      error: error.message,
    });
  }
});

module.exports = router;

