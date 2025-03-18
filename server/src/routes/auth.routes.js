// src/routes/auth.routes.js
const express = require("express");
const {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes
router.get("/profile", protect, getProfile);
router.post("/logout", protect, logout);

module.exports = router;
