const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Result = require("../models/Result");

const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");
    if (!student) return res.status(404).json({ message: "Student record not found." });
    const results = await Result.find({ studentId: student.studentId }).sort({ createdAt: -1 });
    return res.json({ ...student.toObject(), results: results || [] });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({ message: "Failed to fetch student profile.", error: error.message });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const { phone, password, address, confessorName, confessorLocation, confessorParish } = req.body || {};
    const updates = {};
    if (phone) updates.phone = String(phone).trim();
    if (address) updates.address = String(address).trim();
    if (confessorName !== undefined) updates.confessorName = confessorName;
    if (confessorLocation !== undefined) updates.confessorLocation = confessorLocation;
    if (confessorParish !== undefined) updates.confessorParish = confessorParish;
    if (password) {
      if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
      updates.password = await bcrypt.hash(String(password), 10);
    }
    const student = await Student.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select("-password");
    return res.json({ message: "Profile updated successfully.", student });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update student profile.", error: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const { search, month, status } = req.query;
    const filter = {};
    if (month) filter.currentMonth = Number(month);
    if (status) filter.status = status;
    if (search) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      filter.$or = [{ studentId: searchRegex }, { name: searchRegex }, { firstName: searchRegex }, { fatherName: searchRegex }, { christianName: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }
    const students = await Student.find(filter).select("-password").sort({ createdAt: -1 });
    return res.json(students);
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({ message: "Failed to load students.", error: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    let student = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) student = await Student.findById(id).select("-password");
    if (!student) student = await Student.findOne({ studentId: id }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found." });
    const results = await Result.find({ studentId: student.studentId });
    return res.json({ ...student.toObject(), results: results || [] });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({ message: "Failed to retrieve student.", error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.password) updateData.password = await bcrypt.hash(String(updateData.password), 10);
    let student = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) student = await Student.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select("-password");
    if (!student) student = await Student.findOneAndUpdate({ studentId: id }, updateData, { new: true, runValidators: true }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.json({ message: "Student updated successfully.", student });
  } catch (error) {
    console.error("Update student error:", error);
    return res.status(500).json({ message: "Failed to update student.", error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    let student = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) student = await Student.findByIdAndDelete(id);
    if (!student) student = await Student.findOneAndDelete({ studentId: id });
    if (!student) return res.status(404).json({ message: "Student not found." });
    await Result.deleteMany({ studentId: student.studentId });
    return res.json({ message: "Student and associated records removed successfully." });
  } catch (error) {
    console.error("Delete student error:", error);
    return res.status(500).json({ message: "Failed to delete student.", error: error.message });
  }
};

module.exports = { getStudentProfile, updateStudentProfile, getStudents, getStudentById, updateStudent, deleteStudent };
