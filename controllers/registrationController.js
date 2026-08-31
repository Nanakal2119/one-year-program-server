const bcrypt = require("bcryptjs");
const Registration = require("../models/Registration");
const Student = require("../models/Student");

const generateStudentId = async (academicYear = process.env.ACADEMIC_YEAR || "2019") => {
  const prefix = `ተል${academicYear}_`;
  try {
    const [students, registrations] = await Promise.all([
      Student.find({ studentId: { $regex: `^${prefix}` } }).select("studentId").lean(),
      Registration.find({ studentId: { $regex: `^${prefix}` } }).select("studentId").lean(),
    ]);
    let maxSequence = 0;
    [...students, ...registrations].forEach(item => {
      const parts = item?.studentId?.split("_"); const num = parts?.length > 1 ? parseInt(parts[1], 10) : NaN;
      if (!Number.isNaN(num) && num > maxSequence) maxSequence = num;
    });
    return `${prefix}${String(maxSequence + 1).padStart(3, "0")}`;
  } catch (err) {
    console.warn("Error calculating student sequence, using fallback:", err.message);
    return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
  }
};

const createRegistration = async (req, res) => {
  let createdStudent = null; let createdRegistration = null;
  try {
    const body = req.body || {};
    const { firstName, fatherName, middleName, grandfatherName, lastName, christianName, age, gender, dateOfBirth, birthDate, phone, email, employmentStatus, workStatus, maritalStatus, hasChildren, numberOfChildren, hasConfessor, hasConfessionFather, confessorName, confessionFatherName, confessorLocation, confessorParish, confessionFatherParish, address, password, confirmPassword, program } = body;
    const fName = String(firstName || "").trim(), faName = String(fatherName || middleName || "").trim(), gName = String(grandfatherName || lastName || "").trim(), cName = String(christianName || "").trim();
    const eStatus = String(employmentStatus || workStatus || "ተማሪ").trim(), mStatus = String(maritalStatus || "ያላገባ").trim(), hConfessor = String(hasConfessor || hasConfessionFather || "አይ").trim();
    const cParish = String(confessorParish || confessionFatherParish || "").trim(), cLocation = String(confessorLocation || "").trim(), cFatherName = String(confessorName || confessionFatherName || "").trim();
    const dob = dateOfBirth || birthDate || new Date().toISOString(), normalizedEmail = String(email || "").trim().toLowerCase(), normalizedPhone = String(phone || "").trim();
    if (!fName || !faName) return res.status(400).json({ message: "First name and father's name are required." });
    if (!cName) return res.status(400).json({ message: "Christian name is required." });
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: "Please enter a valid email address." });
    if (!normalizedPhone) return res.status(400).json({ message: "Phone number is required." });
    if (!password || String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
    if (String(password) !== String(confirmPassword || "")) return res.status(400).json({ message: "Passwords do not match." });

    const [existingStudent, existingRegistration] = await Promise.all([Student.findOne({ email: normalizedEmail }).lean(), Registration.findOne({ email: normalizedEmail }).lean()]);
    if (existingStudent || existingRegistration) return res.status(409).json({ message: `A student with this email is already registered${existingStudent?.studentId || existingRegistration?.studentId ? ` (ID: ${existingStudent?.studentId || existingRegistration?.studentId})` : ""}.`, studentId: existingStudent?.studentId || existingRegistration?.studentId || null });

    const academicYear = process.env.ACADEMIC_YEAR || "2019", studentId = await generateStudentId(academicYear), hashedPassword = await bcrypt.hash(String(password), 12), fullName = `${fName} ${faName} ${gName}`.trim();
    createdStudent = await Student.create({ studentId, firstName: fName, fatherName: faName, grandfatherName: gName, name: fullName, christianName: cName, age: Number(age) || 20, gender: gender || "ወንድ", dateOfBirth: new Date(dob), phone: normalizedPhone, email: normalizedEmail, address: String(address || "").trim(), employmentStatus: eStatus, maritalStatus: mStatus, hasChildren: hasChildren || "", numberOfChildren: Number(numberOfChildren) || 0, hasConfessor: hConfessor, confessorName: cFatherName, confessorLocation: cLocation, confessorParish: cParish, password: hashedPassword, program: program || "One-Year Program", level: "First Year", entryYear: academicYear, currentMonth: 1, gpa: 0, status: "active" });
    createdRegistration = await Registration.create({ firstName: fName, middleName: faName, fatherName: faName, lastName: gName, grandfatherName: gName, christianName: cName, age: Number(age) || 20, gender: gender || "ወንድ", birthDate: new Date(dob), dateOfBirth: String(dob), phone: normalizedPhone, workStatus: eStatus, employmentStatus: eStatus, maritalStatus: mStatus, hasChildren: hasChildren || "", numberOfChildren: Number(numberOfChildren) || 0, address: String(address || "").trim(), hasConfessionFather: hConfessor, hasConfessor: hConfessor, confessionFatherName: cFatherName, confessorName: cFatherName, confessionFatherParish: cParish, confessorParish: cParish, confessorLocation: cLocation, email: normalizedEmail, password: hashedPassword, studentId, status: "approved", approvedAt: new Date() });
    return res.status(201).json({ message: "Registration completed successfully.", studentId, student: { id: createdStudent._id, studentId: createdStudent.studentId, name: createdStudent.name, email: createdStudent.email, status: createdStudent.status }, registration: { id: createdRegistration._id, studentId: createdRegistration.studentId } });
  } catch (error) {
    console.error("Registration error:", error);
    try { if (createdRegistration?._id) await Registration.findByIdAndDelete(createdRegistration._id); if (createdStudent?._id) await Student.findByIdAndDelete(createdStudent._id); } catch (rollbackError) { console.error("Registration rollback error:", rollbackError); }
    if (error?.code === 11000) return res.status(409).json({ message: "This registration conflicts with an existing student. Please verify the email and try again." });
    return res.status(500).json({ message: "Unable to complete registration. Please try again.", error: process.env.NODE_ENV === "production" ? undefined : error.message });
  }
};

const getRegistrations = async (req, res) => {
  try {
    const [registrations, students] = await Promise.all([Registration.find().select("-password").sort({ createdAt: -1 }).lean(), Student.find().select("-password").sort({ createdAt: -1 }).lean()]);
    const map = new Map();
    registrations.forEach(reg => { if (reg?.studentId) map.set(reg.studentId, { ...reg, id: reg._id }); });
    students.forEach(st => { if (st?.studentId && !map.has(st.studentId)) map.set(st.studentId, { _id: st._id, id: st._id, studentId: st.studentId, firstName: st.firstName, fatherName: st.fatherName, middleName: st.fatherName, grandfatherName: st.grandfatherName, lastName: st.grandfatherName, christianName: st.christianName, email: st.email, phone: st.phone, gender: st.gender, age: st.age, birthDate: st.dateOfBirth, dateOfBirth: st.dateOfBirth, employmentStatus: st.employmentStatus, workStatus: st.employmentStatus, maritalStatus: st.maritalStatus, hasChildren: st.hasChildren, hasConfessor: st.hasConfessor, hasConfessionFather: st.hasConfessor, confessorName: st.confessorName, confessorParish: st.confessorParish, address: st.address, status: st.status || "approved", createdAt: st.createdAt }); });
    return res.json(Array.from(map.values()).sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  } catch (error) { return res.status(500).json({ message: "Unable to retrieve registration records.", error: error.message }); }
};

const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id).select("-password").lean();
    if (registration) return res.json(registration);
    const student = await Student.findOne(/^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { studentId: id }).select("-password").lean();
    if (student) return res.json(student);
    return res.status(404).json({ message: "Registration not found." });
  } catch (error) { return res.status(500).json({ message: "Unable to retrieve registration.", error: error.message }); }
};
module.exports = { createRegistration, getRegistrations, getRegistrationById };
