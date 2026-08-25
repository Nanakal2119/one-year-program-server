const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const examRoutes = require("./routes/examRoutes");
const resultRoutes = require("./routes/resultRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const learningResourceRoutes = require("./routes/learningResourceRoutes");
const { JWT_SECRET } = require("./middleware/authMiddleware");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI && isProduction) {
  console.warn("WARNING: MONGO_URI is not configured. Database-backed requests will fail.");
}

/* =========================
   CORS
========================= */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || "").split(","),
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
].map((value) => String(value || "").trim().replace(/\/$/, "")).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    // Vercel preview URLs are useful during testing. Keep this explicit rather
    // than allowing every website in production.
    if (/^https:\/\/[^/]+\.vercel\.app$/.test(normalized)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   DATABASE CONNECTION
   Cached so Vercel does not open a new MongoDB connection on every request.
========================= */
let databasePromise = null;

function connectDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!MONGO_URI) return Promise.reject(new Error("MONGO_URI is not configured."));

  if (!databasePromise) {
    databasePromise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    }).then(() => {
      console.log("MongoDB connected successfully");
    }).catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

// All database routes wait for MongoDB before executing. This is important in
// serverless production where there is no long-running app.listen() process.
app.use("/api", async (req, res, next) => {
  if (req.path === "/health") return next();
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(503).json({
      message: "Database is currently unavailable.",
      error: isProduction ? undefined : error.message,
    });
  }
});

/* =========================
   AUTH
========================= */
app.post("/api/auth/student/login", (req, res, next) => {
  req.url = "/login";
  studentRoutes(req, res, next);
});

app.post("/api/auth/admin/login", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const adminUser = String(username || email || "").trim();
    const adminPassword = String(password || "");

    if (!adminUser || !adminPassword) {
      return res.status(400).json({ message: "Username/Email and password are required." });
    }

    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;

    if (!ADMIN_USER || !ADMIN_PASS) {
      return res.status(503).json({ message: "Administrator credentials are not configured." });
    }

    const isMatch = (adminUser === ADMIN_USER || adminUser === "admin@example.com") && adminPassword === ADMIN_PASS;
    if (!isMatch) return res.status(401).json({ message: "Invalid administrator credentials." });

    const token = jwt.sign(
      { id: "admin_super", username: ADMIN_USER, role: "admin", isAdmin: true },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Admin authentication successful.",
      token,
      admin: { username: ADMIN_USER, role: "admin" },
    });
  } catch (error) {
    return res.status(500).json({ message: "Admin authentication failed.", error: error.message });
  }
});

/* =========================
   API ROUTES
========================= */
app.use("/api/registrations", registrationRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/learning-resources", learningResourceRoutes);

app.get("/api/health", async (req, res) => {
  let database = "disconnected";
  try {
    await connectDatabase();
    database = "connected";
  } catch (_) {
    database = "disconnected";
  }

  res.json({
    status: database === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database,
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "One-Year Program API is running", version: "3.0.0", health: "/api/health" });
});

app.use((err, req, res, next) => {
  console.error("API error:", err.message);
  if (err.message === "CORS origin not allowed") {
    return res.status(403).json({ message: "Request origin is not allowed." });
  }
  return res.status(err.status || 500).json({ message: err.message || "Internal server error." });
});

// Vercel imports this app instead of calling app.listen().
module.exports = app;

// Local development only.
if (require.main === module) {
  connectDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}
