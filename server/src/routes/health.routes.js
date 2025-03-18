// src/routes/health.routes.js
const express = require("express");
const router = express.Router();
const { sequelize } = require("../models");

// Basic health check endpoint
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      message: "Server is running",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Database connection health check
router.get("/db", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: "success",
      message: "Database connection is healthy",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

module.exports = router;
