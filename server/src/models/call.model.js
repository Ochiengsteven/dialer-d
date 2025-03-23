/**
 * @swagger
 * components:
 *   schemas:
 *     Call:
 *       type: object
 *       required:
 *         - caller_id
 *         - receiver_id
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the call
 *         caller_id:
 *           type: string
 *           format: uuid
 *           description: The caller's user ID
 *         receiver_id:
 *           type: string
 *           format: uuid
 *           description: The receiver's user ID
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: When the call started
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: When the call ended
 *         duration:
 *           type: integer
 *           description: Call duration in seconds
 *         status:
 *           type: string
 *           enum: [connecting, active, ended, failed]
 *           description: The current call status
 *         caller_rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating given by the caller
 *         receiver_rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating given by the receiver
 *         caller_feedback:
 *           type: string
 *           description: Feedback tags from caller
 *         receiver_feedback:
 *           type: string
 *           description: Feedback tags from receiver
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the call record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the call record was last updated
 */
const { sequelize, Sequelize } = require("./index");

const Call = sequelize.define("call", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  caller_id: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  receiver_id: {
    type: Sequelize.UUID,
    allowNull: false,
  },
  start_time: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  end_time: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  duration: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: Sequelize.ENUM("connecting", "active", "ended", "failed"),
    defaultValue: "connecting",
  },
  caller_rating: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
  },
  receiver_rating: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
  },
  caller_feedback: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  receiver_feedback: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

module.exports = Call;
