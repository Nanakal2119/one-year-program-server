const Course = require("../models/Course");

const getCourses = async (req, res) => {
  try { return res.json(await Course.find().sort({ month: 1, code: 1 })); }
  catch (error) { return res.status(500).json({ message: "Failed to fetch courses.", error: error.message }); }
};
const getCoursesByMonth = async (req, res) => {
  try { return res.json(await Course.find({ month: Number(req.params.month) }).sort({ code: 1 })); }
  catch (error) { return res.status(500).json({ message: "Failed to fetch month courses.", error: error.message }); }
};
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params; let course = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) course = await Course.findById(id);
    if (!course) course = await Course.findOne({ code: id });
    if (!course) return res.status(404).json({ message: "Course not found." });
    return res.json(course);
  } catch (error) { return res.status(500).json({ message: "Failed to retrieve course.", error: error.message }); }
};
const createCourse = async (req, res) => {
  try {
    const { code, name, credits, month, progress, outline } = req.body || {};
    if (!code || !name || credits === undefined || month === undefined) return res.status(400).json({ message: "Course code, name, credits, and month are required." });
    const existing = await Course.findOne({ code: String(code).trim() });
    if (existing) return res.status(409).json({ message: "Course code already exists." });
    const course = await Course.create({ code: String(code).trim(), name: String(name).trim(), credits: Number(credits), month: Number(month), progress: Number(progress) || 0, outline: outline || "" });
    return res.status(201).json({ message: "Course created successfully.", course });
  } catch (error) { return res.status(500).json({ message: "Failed to create course.", error: error.message }); }
};
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params; let course = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) course = await Course.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!course) course = await Course.findOneAndUpdate({ code: id }, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: "Course not found." });
    return res.json({ message: "Course updated successfully.", course });
  } catch (error) { return res.status(500).json({ message: "Failed to update course.", error: error.message }); }
};
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params; let course = null;
    if (/^[0-9a-fA-F]{24}$/.test(id)) course = await Course.findByIdAndDelete(id);
    if (!course) course = await Course.findOneAndDelete({ code: id });
    if (!course) return res.status(404).json({ message: "Course not found." });
    return res.json({ message: "Course deleted successfully." });
  } catch (error) { return res.status(500).json({ message: "Failed to delete course.", error: error.message }); }
};
module.exports = { getCourses, getCoursesByMonth, getCourseById, createCourse, updateCourse, deleteCourse };
