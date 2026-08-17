const express = require("express");

const LearningResource = require("../models/LearningResource");

const router = express.Router();

/* =========================
   GET ALL RESOURCES
========================= */

router.get("/", async (req, res) => {
  try {
    const resources = await LearningResource.find()
      .sort({ month: 1, createdAt: -1 });

    res.json(resources);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch learning resources",
    });
  }
});

/* =========================
   GET ONE RESOURCE
========================= */

router.get("/:id", async (req, res) => {
  try {
    const resource =
      await LearningResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        message: "Learning resource not found",
      });
    }

    res.json(resource);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch learning resource",
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
      videoUrl,
      duration,
      resourceUrl,
    } = req.body;

    if (
      !course ||
      !month ||
      !className ||
      !title ||
      !videoUrl
    ) {
      return res.status(400).json({
        message:
          "Course, month, class, title and video URL are required",
      });
    }

    const resource =
      await LearningResource.create({
        course,
        month,
        className,
        title,
        description,
        videoUrl,
        duration,
        resourceUrl,
      });

    res.status(201).json(resource);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create learning resource",
    });
  }
});

/* =========================
   UPDATE RESOURCE
========================= */

router.put("/:id", async (req, res) => {
  try {
    const resource =
      await LearningResource.findByIdAndUpdate(
        req.params.id,
        req.body,
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
    console.error(error);

    res.status(500).json({
      message: "Failed to update learning resource",
    });
  }
});

/* =========================
   DELETE RESOURCE
========================= */

router.delete("/:id", async (req, res) => {
  try {
    const resource =
      await LearningResource.findByIdAndDelete(
        req.params.id
      );

    if (!resource) {
      return res.status(404).json({
        message: "Learning resource not found",
      });
    }

    res.json({
      message: "Learning resource deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete learning resource",
    });
  }
});

module.exports = router;

