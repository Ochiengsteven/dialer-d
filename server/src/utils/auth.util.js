// src/utils/auth.util.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Generate a random username with a prefix and digits
 * @returns {string} A random username
 */
const generateRandomUsername = () => {
  const prefixes = ["Anon", "User", "Guest", "Visitor", "Member", "Friend"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${randomDigits}`;
};

/**
 * Generate a JWT token
 * @param {Object} payload - The data to encode in the token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} The JWT token
 */
const generateToken = (payload, expiresIn = "24h") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate a refresh token
 * @returns {string} A random token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} The decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} Validation result with status and message
 */
const validatePassword = (password) => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return { isValid: true, message: "Password is valid" };
};

module.exports = {
  generateRandomUsername,
  generateToken,
  generateRefreshToken,
  verifyToken,
  validatePassword,
};
