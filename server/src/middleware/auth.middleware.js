// src/middleware/auth.middleware.js
const { verifyToken } = require("../utils/auth.util");

/**
 * Middleware to protect routes that require authentication
 */
const protect = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required. Please login.",
      });
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token. Please login again.",
      });
    }

    // Add user ID to request
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Authentication failed. Please login again.",
    });
  }
};

module.exports = {
  protect,
};
