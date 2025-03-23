// src/models/user.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - username
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         username:
 *           type: string
 *           description: User's username
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: User's gender
 *         latitude:
 *           type: number
 *           format: float
 *           description: User's location latitude
 *         longitude:
 *           type: number
 *           format: float
 *           description: User's location longitude
 *         city:
 *           type: string
 *           description: User's city
 *         country:
 *           type: string
 *           description: User's country
 *         trust_score:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 100
 *           description: User's trust score
 *         subscription_tier:
 *           type: string
 *           enum: [free, basic, premium, premium_plus]
 *           description: User's subscription level
 *         subscription_expiry:
 *           type: string
 *           format: date-time
 *           description: When the subscription expires
 *         last_active:
 *           type: string
 *           format: date-time
 *           description: When the user was last active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the user was last updated
 */
const { sequelize, Sequelize } = require("./index");
const bcrypt = require("bcrypt");

const User = sequelize.define(
  "user",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    gender: {
      type: Sequelize.ENUM("male", "female", "other"),
      allowNull: true,
    },
    latitude: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    city: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    country: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    trust_score: {
      type: Sequelize.FLOAT,
      defaultValue: 50.0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    subscription_tier: {
      type: Sequelize.ENUM("free", "basic", "premium", "premium_plus"),
      defaultValue: "free",
    },
    subscription_expiry: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    last_active: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
    refresh_token: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method to compare passwords
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
