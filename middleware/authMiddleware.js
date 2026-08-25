const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "one_year_program_jwt_secret_2026";

/**
 * Middleware to verify JWT token from Authorization header.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  
  if (!authHeader) {
    return res.status(401).json({
      message: "Access token required. Please log in.",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({
      message: "Access token missing.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

/**
 * Middleware for student-only access (or student matching own resource / admin).
 */
const verifyStudent = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user) {
      return next();
    }
    return res.status(403).json({
      message: "Access denied. Student access required.",
    });
  });
};

/**
 * Middleware for admin-only access.
 */
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user && (req.user.role === "admin" || req.user.isAdmin)) {
      return next();
    }
    return res.status(403).json({
      message: "Access denied. Administrator privileges required.",
    });
  });
};

module.exports = {
  verifyToken,
  verifyStudent,
  verifyAdmin,
  JWT_SECRET,
};
