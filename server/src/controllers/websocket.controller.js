const { User, Connection } = require("../models");

/**
 * @swagger
 * /api/websocket/status:
 *   get:
 *     summary: Get current WebSocket connection status
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [online, in_queue, in_call, offline]
 *                 queue_position:
 *                   type: integer
 *                   nullable: true
 *                 queue_joined_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const getConnectionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const connection = await Connection.findOne({
      where: { user_id: userId },
    });

    if (!connection) {
      return res.status(200).json({
        status: "offline",
        queue_position: null,
        queue_joined_at: null,
      });
    }

    // If in queue, calculate position
    let queuePosition = null;
    if (connection.status === "in_queue") {
      queuePosition = await req.io.getQueuePosition(userId);
    }

    return res.status(200).json({
      status: connection.status,
      queue_position: queuePosition,
      queue_joined_at: connection.queue_joined_at,
    });
  } catch (error) {
    console.error("Error in getConnectionStatus:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get connection status",
    });
  }
};

/**
 * @swagger
 * /api/websocket/active-connections:
 *   get:
 *     summary: Get active connection count
 *     tags: [WebSocket]
 *     responses:
 *       200:
 *         description: Connection counts returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 in_queue:
 *                   type: integer
 *                 in_call:
 *                   type: integer
 *       500:
 *         description: Server error
 */
const getActiveConnectionCount = async (req, res) => {
  try {
    const total = await Connection.count({
      where: { status: ["online", "in_queue", "in_call"] },
    });

    const inQueue = await Connection.count({
      where: { status: "in_queue" },
    });

    const inCall = await Connection.count({
      where: { status: "in_call" },
    });

    return res.status(200).json({
      total,
      in_queue: inQueue,
      in_call: inCall,
    });
  } catch (error) {
    console.error("Error in getActiveConnectionCount:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to get active connection count",
    });
  }
};

module.exports = {
  getConnectionStatus,
  getActiveConnectionCount,
};
