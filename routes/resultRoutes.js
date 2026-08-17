const express = require("express");
const Result = require("../models/Result");

const router = express.Router();

router.get("/:studentId", async (req, res) => {
  try {
    const results = await Result.find({
      studentId: req.params.studentId,
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
