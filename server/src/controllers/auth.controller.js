// src/controllers/auth.controller.js
const User = require("../models/user.model");
const {
  generateRandomUsername,
  generateToken,
  generateRefreshToken,
  validatePassword,
} = require("../utils/auth.util");

/**
 * Register a new user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      gender,
      latitude,
      longitude,
      city,
      country,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already in use",
      });
    }

    // Validate password
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Passwords do not match",
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: passwordValidation.message,
      });
    }

    // Generate a random username
    let username = generateRandomUsername();
    let usernameExists = await User.findOne({ where: { username } });

    // Make sure username is unique
    while (usernameExists) {
      username = generateRandomUsername();
      usernameExists = await User.findOne({ where: { username } });
    }

    // Create new user
    const newUser = await User.create({
      email,
      password,
      username,
      gender,
      latitude,
      longitude,
      city,
      country,
    });

    // Generate auth tokens
    const token = generateToken({ id: newUser.id });
    const refreshToken = generateRefreshToken();

    // Save refresh token to user
    await newUser.update({ refresh_token: refreshToken });

    // Return user data and tokens
    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          gender: newUser.gender,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to register user",
      error: error.message,
    });
  }
};

/**
 * Login a user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const tokenExpiry = rememberMe ? "7d" : "24h";
    const token = generateToken({ id: user.id }, tokenExpiry);
    const refreshToken = generateRefreshToken();

    // Update user last active and refresh token
    await user.update({
      last_active: new Date(),
      refresh_token: refreshToken,
    });

    // Return user data and tokens
    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          gender: user.gender,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to log in",
      error: error.message,
    });
  }
};

/**
 * Refresh access token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "Refresh token is required",
      });
    }

    // Find user by refresh token
    const user = await User.findOne({ where: { refresh_token: refreshToken } });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newToken = generateToken({ id: user.id });
    const newRefreshToken = generateRefreshToken();

    // Update refresh token in database
    await user.update({ refresh_token: newRefreshToken });

    // Return new tokens
    res.status(200).json({
      status: "success",
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to refresh token",
      error: error.message,
    });
  }
};

/**
 * Get current user profile
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ["password", "refresh_token"] },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get user profile",
      error: error.message,
    });
  }
};

/**
 * Logout a user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // Clear refresh token in database
    await User.update({ refresh_token: null }, { where: { id: req.userId } });

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to logout",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
};
