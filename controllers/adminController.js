const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const adminLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const adminUser = String(username || email || "").trim();
    const adminPassword = String(password || "");
    if (!adminUser || !adminPassword) return res.status(400).json({ message: "Username/Email and password are required." });

    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;
    if (!ADMIN_USER || !ADMIN_PASS) return res.status(503).json({ message: "Administrator credentials are not configured." });

    const isMatch = (adminUser === ADMIN_USER || adminUser === "admin@example.com") && adminPassword === ADMIN_PASS;
    if (!isMatch) return res.status(401).json({ message: "Invalid administrator credentials." });

    const token = jwt.sign({ id: "admin_super", username: ADMIN_USER, role: "admin", isAdmin: true }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ message: "Admin authentication successful.", token, admin: { username: ADMIN_USER, role: "admin" } });
  } catch (error) {
    return res.status(500).json({ message: "Admin authentication failed.", error: error.message });
  }
};

module.exports = { adminLogin };
