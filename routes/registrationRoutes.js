const express = require("express");
const bcrypt = require("bcryptjs");
const Registration = require("../models/Registration");
const Student = require("../models/Student");

const router = express.Router();

/* =====================================================
   HELPER: GENERATE UNIQUE FCFS STUDENT ID
   Format: ተል{YEAR}_{001} (e.g., ተል2019_001, ተል2019_002)
===================================================== */
const generateStudentId = async (academicYear = process.env.ACADEMIC_YEAR || "2019") => {
  const prefix = `ተል${academicYear}_`;

  try {
    const [students, registrations] = await Promise.all([
      Student.find({ studentId: { $regex: `^${prefix}` } }).select("studentId").lean(),
      Registration.find({ studentId: { $regex: `^${prefix}` } }).select("studentId").lean(),
    ]);

    let maxSequence = 0;

    const checkSequence = (list) => {
      (list || []).forEach((item) => {
        if (item && item.studentId) {
          const parts = item.studentId.split("_");
          if (parts.length > 1) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num) && num > maxSequence) {
              maxSequence = num;
            }
          }
        }
      });
    };

    checkSequence(students);
    checkSequence(registrations);

    const nextNumber = String(maxSequence + 1).padStart(3, "0");
    return `${prefix}${nextNumber}`;
  } catch (err) {
    console.warn("Error calculating student sequence, using fallback:", err.message);
    const randomSeq = Math.floor(100 + Math.random() * 900);
    return `${prefix}${randomSeq}`;
  }
};

/* =====================================================
   CREATE REGISTRATION / INSTANT ACCOUNT CREATION
   POST /api/registrations
===================================================== */
router.post("/", async (req, res) => {
  let createdStudent = null;
  let createdRegistration = null;

  try {
    const body = req.body || {};
    console.log("--> Incoming registration submission:", {
      firstName: body.firstName,
      fatherName: body.fatherName,
      email: body.email,
      phone: body.phone,
    });

    const {
      firstName,
      fatherName,
      middleName,
      grandfatherName,
      lastName,
      christianName,
      age,
      gender,
      dateOfBirth,
      birthDate,
      phone,
      email,
      employmentStatus,
      workStatus,
      maritalStatus,
      hasChildren,
      numberOfChildren,
      hasConfessor,
      hasConfessionFather,
      confessorName,
      confessionFatherName,
      confessorLocation,
      confessorParish,
      confessionFatherParish,
      address,
      password,
      confirmPassword,
      program,
    } = body;

    const fName = String(firstName || "").trim();
    const faName = String(fatherName || middleName || "").trim();
    const gName = String(grandfatherName || lastName || "").trim();
    const cName = String(christianName || "").trim();
    const eStatus = String(employmentStatus || workStatus || "ተማሪ").trim();
    const mStatus = String(maritalStatus || "ያላገባ").trim();
    const hConfessor = String(hasConfessor || hasConfessionFather || "አይ").trim();
    const cParish = String(confessorParish || confessionFatherParish || "").trim();
    const cLocation = String(confessorLocation || "").trim();
    const cFatherName = String(confessorName || confessionFatherName || "").trim();
    const dob = dateOfBirth || birthDate || new Date().toISOString();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!fName || !faName) {
      return res.status(400).json({ message: "First name and father's name are required." });
    }
    if (!cName) return res.status(400).json({ message: "Christian name is required." });
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (!normalizedPhone) return res.status(400).json({ message: "Phone number is required." });
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (String(password) !== String(confirmPassword || "")) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check both collections because an account and a registration record are
    // intentionally kept in sync.
    const [existingStudent, existingRegistration] = await Promise.all([
      Student.findOne({ email: normalizedEmail }).lean(),
      Registration.findOne({ email: normalizedEmail }).lean(),
    ]);

    if (existingStudent || existingRegistration) {
      const existingId = existingStudent?.studentId || existingRegistration?.studentId;
      return res.status(409).json({
        message: `A student with this email is already registered${existingId ? ` (ID: ${existingId})` : ""}.`,
        studentId: existingId || null,
      });
    }

    const academicYear = process.env.ACADEMIC_YEAR || "2019";
    const studentId = await generateStudentId(academicYear);
    const hashedPassword = await bcrypt.hash(String(password), 12);
    const fullName = `${fName} ${faName} ${gName}`.trim();

    // Create the account first because the Student collection is the source of
    // truth for portal login. If the registration record fails, the account is
    // removed so a half-saved registration can never be shown to users.
    createdStudent = await Student.create({
      studentId,
      firstName: fName,
      fatherName: faName,
      grandfatherName: gName,
      name: fullName,
      christianName: cName,
      age: Number(age) || 20,
      gender: gender || "ወንድ",
      dateOfBirth: new Date(dob),
      phone: normalizedPhone,
      email: normalizedEmail,
      address: String(address || "").trim(),
      employmentStatus: eStatus,
      maritalStatus: mStatus,
      hasChildren: hasChildren || "",
      numberOfChildren: Number(numberOfChildren) || 0,
      hasConfessor: hConfessor,
      confessorName: cFatherName,
      confessorLocation: cLocation,
      confessorParish: cParish,
      password: hashedPassword,
      program: program || "One-Year Program",
      level: "First Year",
      entryYear: academicYear,
      currentMonth: 1,
      gpa: 0,
      status: "active",
    });

    createdRegistration = await Registration.create({
      firstName: fName,
      middleName: faName,
      fatherName: faName,
      lastName: gName,
      grandfatherName: gName,
      christianName: cName,
      age: Number(age) || 20,
      gender: gender || "ወንድ",
      birthDate: new Date(dob),
      dateOfBirth: String(dob),
      phone: normalizedPhone,
      workStatus: eStatus,
      employmentStatus: eStatus,
      maritalStatus: mStatus,
      hasChildren: hasChildren || "",
      numberOfChildren: Number(numberOfChildren) || 0,
      address: String(address || "").trim(),
      hasConfessionFather: hConfessor,
      hasConfessor: hConfessor,
      confessionFatherName: cFatherName,
      confessorName: cFatherName,
      confessionFatherParish: cParish,
      confessorParish: cParish,
      confessorLocation: cLocation,
      email: normalizedEmail,
      password: hashedPassword,
      studentId,
      status: "approved",
      approvedAt: new Date(),
    });

    console.log("Registration saved successfully:", {
      studentId,
      studentMongoId: createdStudent._id,
      registrationMongoId: createdRegistration._id,
    });

    return res.status(201).json({
      message: "Registration completed successfully.",
      studentId,
      student: {
        id: createdStudent._id,
        studentId: createdStudent.studentId,
        name: createdStudent.name,
        email: createdStudent.email,
        status: createdStudent.status,
      },
      registration: {
        id: createdRegistration._id,
        studentId: createdRegistration.studentId,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Roll back whichever document was created before the failure.
    try {
      if (createdRegistration?._id) await Registration.findByIdAndDelete(createdRegistration._id);
      if (createdStudent?._id) await Student.findByIdAndDelete(createdStudent._id);
    } catch (rollbackError) {
      console.error("Registration rollback error:", rollbackError);
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        message: "This registration conflicts with an existing student. Please verify the email and try again.",
      });
    }

    return res.status(500).json({
      message: "Unable to complete registration. Please try again.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
});

/* =====================================================
   GET ALL REGISTRATIONS (Admin Directory View)
   GET /api/registrations
===================================================== */
router.get("/", async (req, res) => {
  try {
    const [registrations, students] = await Promise.all([
      Registration.find().select("-password").sort({ createdAt: -1 }).lean(),
      Student.find().select("-password").sort({ createdAt: -1 }).lean(),
    ]);

    // Map by studentId so no registered student is ever missed
    const map = new Map();

    (registrations || []).forEach((reg) => {
      if (reg && reg.studentId) {
        map.set(reg.studentId, {
          ...reg,
          id: reg._id,
        });
      }
    });

    (students || []).forEach((st) => {
      if (st && st.studentId) {
        if (!map.has(st.studentId)) {
          map.set(st.studentId, {
            _id: st._id,
            id: st._id,
            studentId: st.studentId,
            firstName: st.firstName,
            fatherName: st.fatherName,
            middleName: st.fatherName,
            grandfatherName: st.grandfatherName,
            lastName: st.grandfatherName,
            christianName: st.christianName,
            email: st.email,
            phone: st.phone,
            gender: st.gender,
            age: st.age,
            birthDate: st.dateOfBirth,
            dateOfBirth: st.dateOfBirth,
            employmentStatus: st.employmentStatus,
            workStatus: st.employmentStatus,
            maritalStatus: st.maritalStatus,
            hasChildren: st.hasChildren,
            hasConfessor: st.hasConfessor,
            hasConfessionFather: st.hasConfessor,
            confessorName: st.confessorName,
            confessorParish: st.confessorParish,
            address: st.address,
            status: st.status || "approved",
            createdAt: st.createdAt,
          });
        }
      }
    });

    const list = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    return res.json(list);
  } catch (error) {
    console.error("Get registrations error:", error);
    return res.status(500).json({
      message: "Unable to retrieve registration records.",
      error: error.message,
    });
  }
});

/* =====================================================
   GET ONE REGISTRATION
   GET /api/registrations/:id
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).select("-password").lean();

    if (!registration) {
      // Check in Student collection by studentId or ID
      const student = await Student.findOne({
        $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { studentId: req.params.id }],
      }).select("-password").lean();

      if (student) {
        return res.json(student);
      }

      return res.status(404).json({
        message: "Registration not found.",
      });
    }

    return res.json(registration);
  } catch (error) {
    console.error("Get registration error:", error);
    return res.status(500).json({
      message: "Unable to retrieve registration.",
      error: error.message,
    });
  }
});

module.exports = router;
