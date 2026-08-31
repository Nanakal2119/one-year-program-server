const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Result = require("../models/Result");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body || {};
    if (!studentId || !password) return res.status(400).json({ message: "Student ID and password are required." });

    const trimmedId = String(studentId).trim();
    const student = await Student.findOne({ studentId: { $regex: new RegExp(`^${trimmedId}$`, "i") } });
    if (!student) return res.status(401).json({ message: "Invalid Student ID or password." });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid Student ID or password." });
    if (student.status === "suspended") return res.status(403).json({ message: "Your student account is suspended. Please contact the administrator." });

    const token = jwt.sign({ id: student._id, studentId: student.studentId, role: student.role || "student" }, JWT_SECRET, { expiresIn: "30d" });
    const results = await Result.find({ studentId: student.studentId }).sort({ createdAt: -1 });

    return res.json({
      message: "Login successful.",
      token,
      student: {
        id: student._id, studentId: student.studentId,
        name: student.name || `${student.firstName} ${student.fatherName}`,
        firstName: student.firstName, fatherName: student.fatherName, grandfatherName: student.grandfatherName,
        christianName: student.christianName, email: student.email, phone: student.phone, gender: student.gender,
        dateOfBirth: student.dateOfBirth, employmentStatus: student.employmentStatus, maritalStatus: student.maritalStatus,
        hasChildren: student.hasChildren, numberOfChildren: student.numberOfChildren, hasConfessor: student.hasConfessor,
        confessorName: student.confessorName, confessorLocation: student.confessorLocation, confessorParish: student.confessorParish,
        program: student.program, level: student.level, entryYear: student.entryYear, currentMonth: student.currentMonth,
        gpa: student.gpa, status: student.status, results: results || [],
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({ message: "Server error during login. Please try again.", error: error.message });
  }
};

module.exports = { studentLogin };
