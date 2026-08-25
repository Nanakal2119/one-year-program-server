// Vercel serverless entry point.
// The Express app itself lives in ../server.js so local development and
// production use the exact same API implementation.
const app = require("../server");

module.exports = app;
