const express = require("express");
const LearningResource = require("../models/LearningResource");

const router = express.Router();

/* =========================
   GET ALL RESOURCES (with filtering)
========================= */
router.get("/", async (req, res) => {
  try {
    const { month, course, type } = req.query;
    const filter = {};

    if (month && month !== "all") {
      filter.month = Number(month);
    }
    if (course && course !== "all") {
      filter.course = course;
    }
    if (type && type !== "all") {
      filter.type = type;
    }

    const resources = await LearningResource.find(filter)
      .sort({ month: 1, createdAt: -1 });

    res.json(resources);
  } catch (error) {
    console.error("Get learning resources error:", error);
    res.status(500).json({
      message: "Failed to fetch learning resources",
      error: error.message,
    });
  }
});

/* =========================
   GET ONE RESOURCE
========================= */
router.get("/:id", async (req, res) => {
  try {
    const resource = await LearningResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Learning resource not found",
      });
    }

    res.json(resource);
  } catch (error) {
    console.error("Get learning resource error:", error);
    res.status(500).json({
      message: "Failed to fetch learning resource",
      error: error.message,
    });
  }
});

/* =========================
   CREATE RESOURCE
========================= */
router.post("/", async (req, res) => {
  try {
    const {
      course,
      month,
      className,
      title,
      description,
      type,
      url,
      videoUrl,
      duration,
      resourceUrl,
      thumbnail,
      uploadedBy,
    } = req.body;

    if (!course || !month || !title) {
      return res.status(400).json({
        message: "Course, month, and title are required.",
      });
    }

    const resource = await LearningResource.create({
      course: course.trim(),
      month: Number(month),
      className: (className || course).trim(),
      title: title.trim(),
      description: (description || "").trim(),
      type: type || "video",
      url: (url || videoUrl || resourceUrl || "").trim(),
      videoUrl: (videoUrl || url || "").trim(),
      duration: (duration || "").trim(),
      resourceUrl: (resourceUrl || url || "").trim(),
      thumbnail: (thumbnail || "").trim(),
      uploadedBy: (uploadedBy || "Admin").trim(),
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error("Create learning resource error:", error);
    res.status(500).json({
      message: "Failed to create learning resource",
      error: error.message,
    });
  }
});

/* =========================
   UPDATE RESOURCE
========================= */
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.month) updateData.month = Number(updateData.month);

    const resource = await LearningResource.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resource) {
      return res.status(404).json({
        message: "Learning resource not found",
      });
    }

    res.json(resource);
  } catch (error) {
    console.error("Update learning resource error:", error);
    res.status(500).json({
      message: "Failed to update learning resource",
      error: error.message,
    });
  }
});

/* =========================
   DELETE RESOURCE
========================= */
router.delete("/:id", async (req, res) => {
  try {
    const resource = await LearningResource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Learning resource not found",
      });
    }

    res.json({
      message: "Learning resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete learning resource error:", error);
    res.status(500).json({
      message: "Failed to delete learning resource",
      error: error.message,
    });
  }
});

module.exports = router;


