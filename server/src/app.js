require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const { sequelize } = require("./models");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const callRoutes = require("./routes/call.routes");
const { serve, setup } = require("./config/swagger");
const { initializeSocketServer } = require("./services/socket.service");

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocketServer(server);

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.socket.io"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Documentation
app.use("/api-docs", serve, setup);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/calls", callRoutes);

// Test call page route
app.get('/test-call', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/test-call.html'));
});

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
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server initialized`);
      console.log(`Test call page available at http://localhost:${PORT}/test-call`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
