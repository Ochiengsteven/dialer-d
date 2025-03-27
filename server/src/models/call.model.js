// src/models/call.model.js
const { sequelize, Sequelize } = require("./index");

/**
 * @swagger
 * components:
 *   schemas:
 *     Call:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the call session
 *         caller_id:
 *           type: string
 *           format: uuid
 *           description: ID of the user who initiated the call
 *         receiver_id:
 *           type: string
 *           format: uuid
 *           description: ID of the user who received the call
 *         status:
 *           type: string
 *           enum: [pending, active, completed, missed, rejected]
 *           description: Current status of the call
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: When the call was started
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: When the call ended
 *         duration:
 *           type: integer
 *           description: Duration of the call in seconds
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the call record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the call record was last updated
 */
const Call = sequelize.define(
  "call",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    caller_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receiver_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: Sequelize.ENUM("pending", "active", "completed", "missed", "rejected"),
      defaultValue: "pending",
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
  }
);

module.exports = Call;
