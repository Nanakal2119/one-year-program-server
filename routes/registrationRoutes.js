const express = require("express");
const bcrypt = require("bcryptjs");

const Registration = require("../models/Registration");
const Student = require("../models/Student");

const router = express.Router();


/* =====================================================
   CREATE REGISTRATION
===================================================== */

router.post("/", async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      christianName,
      age,
      gender,
      birthDate,
      phone,
      workStatus,
      maritalStatus,
      hasChildren,
      address,
      hasConfessionFather,
      confessionFatherName,
      confessionFatherParish,
      email,
      password,
    } = req.body;

    /* =========================
       REQUIRED FIELDS
    ========================= */

    if (
      !firstName ||
      !middleName ||
      !lastName ||
      !christianName ||
      !age ||
      !gender ||
      !birthDate ||
      !phone ||
      !workStatus ||
      !maritalStatus ||
      !address ||
      !hasConfessionFather ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message: "Please complete all required fields.",
      });
    }

    /* =========================
       CHECK EXISTING EMAIL
    ========================= */

    const existingRegistration =
      await Registration.findOne({
        email: email.trim().toLowerCase(),
      });

    if (existingRegistration) {
      return res.status(409).json({
        message:
          "An application with this email already exists.",
      });
    }

    const existingStudent =
      await Student.findOne({
        email: email.trim().toLowerCase(),
      });

    if (existingStudent) {
      return res.status(409).json({
        message:
          "A student account with this email already exists.",
      });
    }

    /* =========================
       HASH PASSWORD
    ========================= */

    const hashedPassword =
      await bcrypt.hash(password, 10);

    /* =========================
       CREATE REGISTRATION
    ========================= */

    const registration =
      await Registration.create({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        christianName: christianName.trim(),

        age,

        gender,

        birthDate,

        phone: phone.trim(),

        workStatus: workStatus.trim(),

        maritalStatus,

        hasChildren:
          hasChildren || "",

        address: address.trim(),

        hasConfessionFather,

        confessionFatherName:
          confessionFatherName || "",

        confessionFatherParish:
          confessionFatherParish || "",

        email:
          email.trim().toLowerCase(),

        password: hashedPassword,

        status: "pending",

        studentAccountCreated: false,
      });

    return res.status(201).json({
      message:
        "Registration submitted successfully.",

      registration: {
        id: registration._id,
        status: registration.status,
      },
    });

  } catch (error) {
    console.error(
      "Registration creation error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to submit registration.",
    });
  }
});


/* =====================================================
   STUDENT LOGIN
   Kept here only for compatibility.
   Main login is /api/students/login.
===================================================== */

router.post("/login", async (req, res) => {
  try {
    const {
      studentId,
      password,
    } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({
        message:
          "Student ID and password are required.",
      });
    }

    const student =
      await Student.findOne({
        studentId:
          studentId.trim(),
      });

    if (!student) {
      return res.status(404).json({
        message:
          "Student ID not found.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        student.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid password.",
      });
    }

    return res.json({
      message:
        "Login successful.",

      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        entryYear: student.entryYear,
        program: student.program,
        level: student.level,
        currentMonth: student.currentMonth,
        gpa: student.gpa,
        status: student.status,
        results: student.results || [],
      },
    });

  } catch (error) {
    console.error(
      "Registration login error:",
      error
    );

    return res.status(500).json({
      message:
        "Server error during login.",
    });
  }
});


/* =====================================================
   GET ALL REGISTRATIONS
   Used by Admin Applications
===================================================== */

router.get("/", async (req, res) => {
  try {
    const registrations =
      await Registration.find()
        .select("-password")
        .sort({ createdAt: -1 });

    return res.json(registrations);

  } catch (error) {
    console.error(
      "Get registrations error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to retrieve registrations.",
    });
  }
});


/* =====================================================
   GET ONE REGISTRATION
===================================================== */

router.get("/:id", async (req, res) => {
  try {
    const registration =
      await Registration.findById(
        req.params.id
      ).select("-password");

    if (!registration) {
      return res.status(404).json({
        message:
          "Registration not found.",
      });
    }

    return res.json(registration);

  } catch (error) {
    console.error(
      "Get registration error:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to retrieve registration.",
    });
  }
});


/* =====================================================
   APPROVE REGISTRATION
   Creates the actual Student account
===================================================== */

router.put(
  "/:id/approve",
  async (req, res) => {
    try {
      const registration =
        await Registration.findById(
          req.params.id
        );

      if (!registration) {
        return res.status(404).json({
          message:
            "Registration not found.",
        });
      }

      /* =========================
         ALREADY APPROVED
      ========================= */

      if (
        registration.status ===
        "approved"
      ) {
        return res.status(400).json({
          message:
            "This application has already been approved.",
        });
      }

      /* =========================
         GENERATE STUDENT ID
      ========================= */

      let studentId =
        registration.studentId;

      if (!studentId) {
        const currentYear =
          new Date().getFullYear();

        const studentCount =
          await Student.countDocuments();

        const number =
          String(studentCount + 1)
            .padStart(3, "0");

        studentId =
          `CS${currentYear}-${number}`;
      }

      /* =========================
         CHECK STUDENT ID
      ========================= */

      const existingStudent =
        await Student.findOne({
          studentId,
        });

      if (existingStudent) {
        return res.status(409).json({
          message:
            "This Student ID already exists.",
        });
      }

      /* =========================
         CREATE STUDENT ACCOUNT
      ========================= */

      const student =
        await Student.create({
          studentId,

          name:
            `${registration.firstName} ${registration.middleName} ${registration.lastName}`,

          email:
            registration.email,

          password:
            registration.password,

          phone:
            registration.phone,

          christianName:
            registration.christianName,

          age:
            registration.age,

          gender:
            registration.gender,

          birthDate:
            registration.birthDate,

          workStatus:
            registration.workStatus,

          maritalStatus:
            registration.maritalStatus,

          hasChildren:
            registration.hasChildren,

          address:
            registration.address,

          hasConfessionFather:
            registration.hasConfessionFather,

          confessionFatherName:
            registration.confessionFatherName,

          confessionFatherParish:
            registration.confessionFatherParish,

          program:
            "Computer Science",

          level:
            "Third Year",

          entryYear:
            String(
              new Date().getFullYear()
            ),

          currentMonth: 1,

          gpa: 0,

          results: [],

          status: "active",

          registrationId:
            registration._id,
        });

      /* =========================
         UPDATE REGISTRATION
      ========================= */

      registration.status =
        "approved";

      registration.studentId =
        studentId;

      registration.approvedAt =
        new Date();

      registration.studentAccountCreated =
        true;

      await registration.save();

      return res.json({
        message:
          "Application approved and student account created.",

        student: {
          id: student._id,
          studentId:
            student.studentId,
          name:
            student.name,
          email:
            student.email,
        },
      });

    } catch (error) {
      console.error(
        "Approve registration error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to approve application.",
        error: error.message,
      });
    }
  }
);


/* =====================================================
   REJECT REGISTRATION
===================================================== */

router.put(
  "/:id/reject",
  async (req, res) => {
    try {
      const registration =
        await Registration.findById(
          req.params.id
        );

      if (!registration) {
        return res.status(404).json({
          message:
            "Registration not found.",
        });
      }

      registration.status =
        "rejected";

      registration.rejectedAt =
        new Date();

      await registration.save();

      return res.json({
        message:
          "Application rejected successfully.",
      });

    } catch (error) {
      console.error(
        "Reject registration error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to reject application.",
      });
    }
  }
);


module.exports = router;
