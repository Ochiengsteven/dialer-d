/**
 * @swagger
 * components:
 *   schemas:
 *     Connection:
 *       type: object
 *       required:
 *         - user_id
 *         - socket_id
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the connection
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: The user's ID
 *         socket_id:
 *           type: string
 *           description: The WebSocket socket ID
 *         status:
 *           type: string
 *           enum: [online, in_queue, in_call, offline]
 *           description: The current user connection status
 *         queue_joined_at:
 *           type: string
 *           format: date-time
 *           description: When the user joined the queue
 *         mood:
 *           type: string
 *           enum: [happy, sad, excited, bored, lonely, drunk]
 *           description: User's current mood
 *         gender_preference:
 *           type: string
 *           enum: [male, female, any]
 *           description: User's gender preference for matching
 *         last_activity:
 *           type: string
 *           format: date-time
 *           description: When the user last had activity
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the connection was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the connection was last updated
 */
const { sequelize, Sequelize } = require("./index");

const Connection = sequelize.define("connection", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  socket_id: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: Sequelize.ENUM("online", "in_queue", "in_call", "offline"),
    defaultValue: "online",
  },
  queue_joined_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  mood: {
    type: Sequelize.ENUM("happy", "sad", "excited", "bored", "lonely", "drunk"),
    allowNull: true,
  },
  gender_preference: {
    type: Sequelize.ENUM("male", "female", "any"),
    defaultValue: "any",
  },
  last_activity: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
});

module.exports = Connection;
