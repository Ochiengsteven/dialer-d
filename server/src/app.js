require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const http = require("http"); // Added for WebSocket support
const { sequelize } = require("./models");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const websocketRoutes = require("./routes/websocket.routes");
const { serve, setup } = require("./config/swagger");
const SocketService = require("./services/socket.service"); // Import socket service

// Initialize Express app
const app = express();
const server = http.createServer(app); // Create HTTP server

// Initialize WebSocket service
const socketService = new SocketService(server);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add socket service to request object
app.use((req, res, next) => {
  req.io = socketService;
  next();
});

// API Documentation
app.use("/api-docs", serve, setup);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/websocket", websocketRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

// Set port and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Sync database models (in development)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("Database synchronized.");
    }

    // Start server
    server.listen(PORT, () => {
      // Use HTTP server instead of Express app
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server initialized`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, socketService }; // Export additional objects
