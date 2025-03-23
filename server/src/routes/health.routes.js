// src/routes/health.routes.js
const express = require("express");
const router = express.Router();
const { sequelize } = require("../models");

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health monitoring endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database connection health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database connection is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Database connection is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Database connection failed
 *                 error:
 *                   type: string
 */
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
