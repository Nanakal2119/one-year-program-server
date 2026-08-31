const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const Exam = require("../models/Exam");

const router = express.Router();

/*
 * =========================
 * MULTER
 * =========================
 *
 * PDFs only.
 */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(
        new Error("Only PDF files are allowed.")
      );
    }

    cb(null, true);
  },
});

/*
 * =========================
 * GET ALL EXAMS
 * =========================
 *
 * ADMIN USE ONLY
 */

router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find()
      .sort({ createdAt: -1 });

    res.json(exams);
  } catch (error) {
    console.error(
      "Get exams error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch exams.",
    });
  }
});

/*
 * =========================
 * GET AVAILABLE EXAMS
 * =========================
 *
 * STUDENT PORTAL
 *
 * An exam must:
 *
 * 1. Be approved
 * 2. Be opened
 * 3. Have exactly 50 questions
 */

router.get("/available", async (req, res) => {
  try {
    const exams = await Exam.find({
      approvalStatus: "approved",

      isAvailable: true,

      questionsReviewed: true,

      $expr: {
        $eq: [
          {
            $size: "$questions",
          },
          50,
        ],
      },
    }).sort({
      date: 1,
    });

    /*
     * NEVER send correct answers
     * to students.
     */

    const safeExams = exams.map(
      (exam) => ({
        _id: exam._id,

        courseCode:
          exam.courseCode,

        courseName:
          exam.courseName,

        duration:
          exam.duration,

        date:
          exam.date,

        questionCount: 50,
      })
    );

    res.json(safeExams);
  } catch (error) {
    console.error(
      "Get available exams error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch available exams.",
    });
  }
});

/*
 * =========================
 * GET ONE EXAM
 * =========================
 *
 * ADMIN
 */

router.get("/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(
      req.params.id
    );

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found.",
      });
    }

    res.json(exam);
  } catch (error) {
    console.error(
      "Get exam error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch exam.",
    });
  }
});

/*
 * =========================
 * CREATE EXAM
 * =========================
 *
 * PDF ONLY
 *
 * New exam automatically becomes:
 *
 * approvalStatus = pending
 * isAvailable = false
 * questionsReviewed = false
 */

router.post(
  "/",
  upload.single("examPdf"),
  async (req, res) => {
    try {
      const {
        courseCode,
        courseName,
        duration,
      } = req.body;

      /*
       * Validate course.
       */

      if (
        !courseCode ||
        !courseName
      ) {
        return res.status(400).json({
          message:
            "Course code and course name are required.",
        });
      }

      /*
       * Validate PDF.
       */

      if (!req.file) {
        return res.status(400).json({
          message:
            "Please upload an exam PDF.",
        });
      }

      if (
        req.file.mimetype !==
        "application/pdf"
      ) {
        return res.status(400).json({
          message:
            "Only PDF files are allowed.",
        });
      }

      /*
       * =========================
       * SAVE PDF TO GRIDFS
       * =========================
       */

      const bucket =
        new mongoose.mongo.GridFSBucket(
          mongoose.connection.db,
          {
            bucketName: "examFiles",
          }
        );

      const uploadStream =
        bucket.openUploadStream(
          req.file.originalname,
          {
            contentType:
              "application/pdf",
          }
        );

      uploadStream.end(req.file.buffer);

      await new Promise(
        (resolve, reject) => {
          uploadStream.on(
            "finish",
            resolve
          );

          uploadStream.on(
            "error",
            reject
          );
        }
      );

      /*
       * =========================
       * CREATE EXAM
       * =========================
       */

      const exam =
        await Exam.create({
          courseCode:
            courseCode.trim(),

          courseName:
            courseName.trim(),

          duration:
            Number(duration) || 60,

          /*
           * IMPORTANT
           */

          approvalStatus:
            "pending",

          isAvailable:
            false,

          questionsReviewed:
            false,

          /*
           * Questions will be
           * created during the
           * review/conversion step.
           */

          questions: [],

          examPdf: {
            fileId:
              uploadStream.id,

            filename:
              req.file.originalname,

            contentType:
              "application/pdf",

            size:
              req.file.size,
          },
        });

      res.status(201).json({
        message:
          "Exam uploaded successfully and is waiting for review.",

        exam,
      });
    } catch (error) {
      console.error(
        "Create exam error:",
        error
      );

      res.status(500).json({
        message:
          error.message ||
          "Failed to create exam.",
      });
    }
  }
);

/*
 * =========================
 * VIEW PDF
 * =========================
 *
 * ADMIN REVIEW
 */

router.get(
  "/:id/pdf",
  async (req, res) => {
    try {
      const exam =
        await Exam.findById(
          req.params.id
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found.",
        });
      }

      if (
        !exam.examPdf ||
        !exam.examPdf.fileId
      ) {
        return res.status(404).json({
          message:
            "PDF not found.",
        });
      }

      const bucket =
        new mongoose.mongo.GridFSBucket(
          mongoose.connection.db,
          {
            bucketName: "examFiles",
          }
        );

      res.set(
        "Content-Type",
        "application/pdf"
      );

      res.set(
        "Content-Disposition",
        `inline; filename="${exam.examPdf.filename}"`
      );

      const downloadStream =
        bucket.openDownloadStream(
          exam.examPdf.fileId
        );

      downloadStream.on(
        "error",
        () => {
          if (!res.headersSent) {
            res.status(404).json({
              message:
                "PDF file not found.",
            });
          }
        }
      );

      downloadStream.pipe(res);
    } catch (error) {
      console.error(
        "View PDF error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to open PDF.",
      });
    }
  }
);

/*
 * =========================
 * SAVE / UPDATE QUESTIONS
 * =========================
 *
 * ADMIN REVIEW
 *
 * Must contain EXACTLY 50.
 */

router.put(
  "/:id/questions",
  async (req, res) => {
    try {
      const { questions } =
        req.body;

      if (
        !Array.isArray(questions)
      ) {
        return res.status(400).json({
          message:
            "Questions must be an array.",
        });
      }

      /*
       * EXACTLY 50 QUESTIONS
       */

      if (
        questions.length !== 50
      ) {
        return res.status(400).json({
          message:
            "The exam must contain exactly 50 questions.",
        });
      }

      /*
       * Validate every question.
       */

      for (
        let i = 0;
        i < questions.length;
        i++
      ) {
        const q =
          questions[i];

        if (
          !q.question ||
          typeof q.question !==
            "string"
        ) {
          return res.status(400).json({
            message:
              `Question ${i + 1} is missing its question text.`,
          });
        }

        if (
          !Array.isArray(q.options) ||
          q.options.length !== 4
        ) {
          return res.status(400).json({
            message:
              `Question ${i + 1} must have exactly 4 options.`,
          });
        }

        if (
          typeof q.correctAnswer !==
            "number" ||
          q.correctAnswer < 0 ||
          q.correctAnswer > 3
        ) {
          return res.status(400).json({
            message:
              `Question ${i + 1} has an invalid correct answer.`,
          });
        }
      }

      const exam =
        await Exam.findById(
          req.params.id
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found.",
        });
      }

      /*
       * Save questions.
       */

      exam.questions =
        questions.map((q) => ({
          question:
            q.question.trim(),

          options:
            q.options.map(
              (option) =>
                String(option).trim()
            ),

          correctAnswer:
            q.correctAnswer,

          points:
            Number(q.points) || 1,
        }));

      exam.questionsReviewed =
        true;

      /*
       * Changing questions puts
       * exam back into pending review.
       */

      exam.approvalStatus =
        "pending";

      exam.isAvailable =
        false;

      await exam.save();

      res.json({
        message:
          "50 questions saved successfully. Exam is ready for approval.",

        exam,
      });
    } catch (error) {
      console.error(
        "Save questions error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to save questions.",
      });
    }
  }
);

/*
 * =========================
 * APPROVE EXAM
 * =========================
 */

router.put(
  "/:id/approve",
  async (req, res) => {
    try {
      const exam =
        await Exam.findById(
          req.params.id
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found.",
        });
      }

      /*
       * Questions must be reviewed.
       */

      if (
        !exam.questionsReviewed
      ) {
        return res.status(400).json({
          message:
            "Review and save the 50 questions before approving the exam.",
        });
      }

      /*
       * EXACTLY 50.
       */

      if (
        exam.questions.length !==
        50
      ) {
        return res.status(400).json({
          message:
            "The exam must contain exactly 50 questions.",
        });
      }

      exam.approvalStatus =
        "approved";

      /*
       * Approval does NOT publish.
       */

      exam.isAvailable =
        false;

      await exam.save();

      res.json({
        message:
          "Exam approved successfully. It is still closed to students.",

        exam,
      });
    } catch (error) {
      console.error(
        "Approve exam error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to approve exam.",
      });
    }
  }
);

/*
 * =========================
 * REJECT EXAM
 * =========================
 */

router.put(
  "/:id/reject",
  async (req, res) => {
    try {
      const exam =
        await Exam.findById(
          req.params.id
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found.",
        });
      }

      exam.approvalStatus =
        "rejected";

      exam.isAvailable =
        false;

      exam.questionsReviewed =
        false;

      await exam.save();

      res.json({
        message:
          "Exam rejected successfully.",

        exam,
      });
    } catch (error) {
      console.error(
        "Reject exam error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to reject exam.",
      });
    }
  }
);

/*
 * =========================
 * OPEN / CLOSE EXAM
 * =========================
 *
 * The exam can ONLY be opened
 * after approval.
 */

router.put(
  "/:id/status",
  async (req, res) => {
    try {
      const {
        isAvailable,
      } = req.body;

      const exam =
        await Exam.findById(
          req.params.id
        );

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found.",
        });
      }

      /*
       * Cannot open a pending
       * or rejected exam.
       */

      if (
        isAvailable === true &&
        exam.approvalStatus !==
          "approved"
      ) {
        return res.status(400).json({
          message:
            "The exam must be approved before it can be opened to students.",
        });
      }

      /*
       * Cannot open without
       * exactly 50 reviewed questions.
       */

      if (
        isAvailable === true &&
        (
          !exam.questionsReviewed ||
          exam.questions.length !==
            50
        )
      ) {
        return res.status(400).json({
          message:
            "The exam must have 50 reviewed questions before it can be opened.",
        });
      }

      exam.isAvailable =
        Boolean(isAvailable);

      await exam.save();

      res.json({
        message:
          exam.isAvailable
            ? "Exam is now available to students."
            : "Exam has been closed.",

        exam,
      });
    } catch (error) {
      console.error(
        "Update exam status error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update exam status.",
      });
    }
  }
);

module.exports = router;
