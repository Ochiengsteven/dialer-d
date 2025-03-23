const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const { User, Connection, Sequelize } = require("../models");

class SocketService {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: "/socket.io",
    });

    this.connections = new Map(); // Map to track active socket connections
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        // Extract token from the handshake auth
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error: Token required"));
        }

        // Verify the token using the JWT_SECRET from env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user data to socket
        socket.userId = decoded.id;
        socket.user = decoded;

        // Create or update connection record
        const [connection, created] = await Connection.findOrCreate({
          where: { user_id: decoded.id },
          defaults: {
            socket_id: socket.id,
            status: "online",
            last_activity: new Date(),
          },
        });

        if (!created) {
          await connection.update({
            socket_id: socket.id,
            status: "online",
            last_activity: new Date(),
          });
        }

        return next();
      } catch (error) {
        console.error("Socket authentication error:", error.message);
        return next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.userId} (Socket ID: ${socket.id})`);

      // Store the connection in our map
      this.connections.set(socket.userId, socket);

      // User enters queue for matching
      socket.on("join_queue", async (data) => {
        try {
          const { mood, gender_preference } = data;

          // Update the connection record
          await Connection.update(
            {
              status: "in_queue",
              mood,
              gender_preference,
              queue_joined_at: new Date(),
              last_activity: new Date(),
            },
            { where: { user_id: socket.userId } }
          );

          // Emit confirmation
          socket.emit("queue_joined", {
            timestamp: new Date(),
            position: await this.getQueuePosition(socket.userId),
          });

          // This is where we'll integrate with the queue management system
          // which will be implemented in the next sprint
        } catch (error) {
          console.error("Error joining queue:", error);
          socket.emit("error", { message: "Failed to join queue" });
        }
      });

      // User leaves queue
      socket.on("leave_queue", async () => {
        try {
          await Connection.update(
            {
              status: "online",
              queue_joined_at: null,
              last_activity: new Date(),
            },
            { where: { user_id: socket.userId } }
          );

          socket.emit("queue_left", { timestamp: new Date() });
        } catch (error) {
          console.error("Error leaving queue:", error);
          socket.emit("error", { message: "Failed to leave queue" });
        }
      });

      // WebRTC signaling events
      socket.on("offer", (data) => {
        const { targetUserId, sdp } = data;
        const targetSocket = this.connections.get(targetUserId);

        if (targetSocket) {
          targetSocket.emit("offer", {
            from: socket.userId,
            sdp,
          });
        }
      });

      socket.on("answer", (data) => {
        const { targetUserId, sdp } = data;
        const targetSocket = this.connections.get(targetUserId);

        if (targetSocket) {
          targetSocket.emit("answer", {
            from: socket.userId,
            sdp,
          });
        }
      });

      socket.on("ice_candidate", (data) => {
        const { targetUserId, candidate } = data;
        const targetSocket = this.connections.get(targetUserId);

        if (targetSocket) {
          targetSocket.emit("ice_candidate", {
            from: socket.userId,
            candidate,
          });
        }
      });

      // Handle call end
      socket.on("end_call", async (data) => {
        const { callId, targetUserId, rating, feedback } = data;
        const targetSocket = this.connections.get(targetUserId);

        // Notify other user
        if (targetSocket) {
          targetSocket.emit("call_ended", { callId });
        }

        // Update connection status
        await Connection.update(
          {
            status: "online",
            last_activity: new Date(),
          },
          { where: { user_id: socket.userId } }
        );

        // Save call rating and feedback
        // This will be implemented with the call model in the next sprint
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        console.log(`User disconnected: ${socket.userId}`);

        this.connections.delete(socket.userId);

        // Update the connection status in the database
        await Connection.update(
          {
            status: "offline",
            last_activity: new Date(),
          },
          { where: { user_id: socket.userId } }
        );
      });
    });
  }

  // Get the current queue position for a user
  async getQueuePosition(userId) {
    try {
      const userConnection = await Connection.findOne({
        where: { user_id: userId, status: "in_queue" },
      });

      if (!userConnection) {
        return null;
      }

      // Count users who joined the queue before this user
      const position = await Connection.count({
        where: {
          status: "in_queue",
          queue_joined_at: {
            [Sequelize.Op.lt]: userConnection.queue_joined_at,
          },
        },
      });

      return position + 1; // Queue position is 1-indexed
    } catch (error) {
      console.error("Error getting queue position:", error);
      return null;
    }
  }

  // Emit event to a specific user
  emitToUser(userId, event, data) {
    const socket = this.connections.get(userId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Emit event to all connected users
  emitToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketService;
