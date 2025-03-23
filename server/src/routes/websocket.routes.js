const express = require("express");
const {
  getConnectionStatus,
  getActiveConnectionCount,
} = require("../controllers/websocket.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Get current connection status (requires authentication)
router.get("/status", authenticate, getConnectionStatus);

// Get active connection count (public endpoint)
router.get("/active-connections", getActiveConnectionCount);

module.exports = router;
