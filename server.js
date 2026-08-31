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

/* =========================================================
   ENVIRONMENT CHECK
========================================================= */

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is not configured.");
}

if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not configured.");
}

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  process.env.FRONTEND_URL,

  ...(process.env.FRONTEND_URLS || "")
    .split(","),

  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",

  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
]
  .map((value) =>
    String(value || "")
      .trim()
      .replace(/\/$/, "")
  )
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Requests without an Origin header can happen with
       * tools such as Postman, curl, or server-to-server calls.
       */
      if (!origin) {
        return callback(null, true);
      }

      const normalized = origin
        .trim()
        .replace(/\/$/, "");

      /*
       * Allow configured frontend URLs.
       */
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      /*
       * Allow Vercel deployments.
       *
       * This covers:
       * https://something.vercel.app
       */
      if (
        /^https:\/\/[^/]+\.vercel\.app$/.test(normalized)
      ) {
        return callback(null, true);
      }

      /*
       * During local development, allow localhost origins.
       */
      if (!isProduction) {
        if (
          /^http:\/\/localhost:\d+$/.test(normalized) ||
          /^http:\/\/127\.0\.0\.1:\d+$/.test(normalized)
        ) {
          return callback(null, true);
        }
      }

      console.error(
        "CORS blocked origin:",
        normalized
      );

      return callback(
        new Error("CORS origin not allowed")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================================
   MONGODB CONNECTION
========================================================= */

let databasePromise = null;

async function connectDatabase() {
  /*
   * Already connected.
   */
  if (mongoose.connection.readyState === 1) {
    return;
  }

  /*
   * Connection currently being established.
   */
  if (mongoose.connection.readyState === 2 && databasePromise) {
    return databasePromise;
  }

  if (!MONGO_URI) {
    throw new Error(
      "MONGO_URI is not configured."
    );
  }

  /*
   * Reuse the same connection promise.
   *
   * This is important for Vercel serverless functions because
   * we don't want every request to create a new connection.
   */
  if (!databasePromise) {
    databasePromise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 0,
      })
      .then(() => {
        console.log(
          "MongoDB connected successfully"
        );
      })
      .catch((error) => {
        databasePromise = null;

        console.error(
          "MongoDB connection failed:",
          error.message
        );

        throw error;
      });
  }

  return databasePromise;
}

/* =========================================================
   DATABASE MIDDLEWARE
========================================================= */

/*
 * Every /api route except /api/health waits for MongoDB.
 *
 * This works for both:
 *
 * Local:
 * localhost:5000
 *
 * Vercel:
 * server-project.vercel.app
 */
app.use(
  "/api",
  async (req, res, next) => {
    /*
     * Health endpoint handles its own database check.
     */
    if (req.path === "/health") {
      return next();
    }

    try {
      await connectDatabase();
      return next();
    } catch (error) {
      console.error(
        "Database connection failed:",
        error.message
      );

      return res.status(503).json({
        message:
          "Database is currently unavailable.",
        error: isProduction
          ? undefined
          : error.message,
      });
    }
  }
);

/* =========================================================
   AUTHENTICATION
========================================================= */

/*
 * Student login
 */
app.post(
  "/api/auth/student/login",
  (req, res, next) => {
    req.url = "/login";
    studentRoutes(req, res, next);
  }
);

/*
 * Admin login
 */
app.post(
  "/api/auth/admin/login",
  async (req, res) => {
    try {
      const {
        username,
        email,
        password,
      } = req.body || {};

      const adminUser = String(
        username || email || ""
      ).trim();

      const adminPassword = String(
        password || ""
      );

      if (!adminUser || !adminPassword) {
        return res.status(400).json({
          message:
            "Username/Email and password are required.",
        });
      }

      const ADMIN_USER =
        process.env.ADMIN_USER;

      const ADMIN_PASS =
        process.env.ADMIN_PASS;

      if (!ADMIN_USER || !ADMIN_PASS) {
        return res.status(503).json({
          message:
            "Administrator credentials are not configured.",
        });
      }

      const isMatch =
        (
          adminUser === ADMIN_USER ||
          adminUser === "admin@example.com"
        ) &&
        adminPassword === ADMIN_PASS;

      if (!isMatch) {
        return res.status(401).json({
          message:
            "Invalid administrator credentials.",
        });
      }

      const token = jwt.sign(
        {
          id: "admin_super",
          username: ADMIN_USER,
          role: "admin",
          isAdmin: true,
        },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.json({
        message:
          "Admin authentication successful.",

        token,

        admin: {
          username: ADMIN_USER,
          role: "admin",
        },
      });
    } catch (error) {
      console.error(
        "Admin authentication error:",
        error.message
      );

      return res.status(500).json({
        message:
          "Admin authentication failed.",
        error: isProduction
          ? undefined
          : error.message,
      });
    }
  }
);

/* =========================================================
   API ROUTES
========================================================= */

app.use(
  "/api/registrations",
  registrationRoutes
);

app.use(
  "/api/students",
  studentRoutes
);

app.use(
  "/api/courses",
  courseRoutes
);

app.use(
  "/api/exams",
  examRoutes
);

app.use(
  "/api/results",
  resultRoutes
);

app.use(
  "/api/learning-resources",
  learningResourceRoutes
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  async (req, res) => {
    try {
      await connectDatabase();

      return res.json({
        status: "ok",
        timestamp:
          new Date().toISOString(),
        database: "connected",
        environment:
          process.env.NODE_ENV ||
          "development",
      });
    } catch (error) {
      console.error(
        "Health check database error:",
        error.message
      );

      return res.status(503).json({
        status: "degraded",
        timestamp:
          new Date().toISOString(),
        database: "disconnected",
        environment:
          process.env.NODE_ENV ||
          "development",
      });
    }
  }
);

/* =========================================================
   ROOT
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message:
      "One-Year Program API is running",
    version: "3.0.0",
    health: "/api/health",
  });
});

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  return res.status(404).json({
    message: "API route not found.",
    path: req.originalUrl,
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (err, req, res, next) => {
    console.error(
      "API error:",
      err.message
    );

    if (
      err.message ===
      "CORS origin not allowed"
    ) {
      return res.status(403).json({
        message:
          "Request origin is not allowed.",
      });
    }

    return res.status(
      err.status || 500
    ).json({
      message:
        err.message ||
        "Internal server error.",
      error: isProduction
        ? undefined
        : err.stack,
    });
  }
);

/* =========================================================
   EXPORT FOR VERCEL
========================================================= */

/*
 * IMPORTANT:
 *
 * We export the Express application.
 *
 * Vercel will handle the HTTP server.
 */
module.exports = app;

/* =========================================================
   LOCAL DEVELOPMENT
========================================================= */

/*
 * app.listen() is ONLY used when running:
 *
 * node server.js
 *
 * or
 *
 * npm run dev
 *
 * locally.
 *
 * Vercel imports the app above and does NOT execute
 * this section.
 */
if (require.main === module) {
  connectDatabase()
    .then(() => {
      app.listen(
        PORT,
        () => {
          console.log(
            `Server running on port ${PORT}`
          );
        }
      );
    })
    .catch((error) => {
      console.error(
        "MongoDB connection failed:",
        error.message
      );

      process.exit(1);
    });
}