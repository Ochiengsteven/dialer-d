// src/models/index.js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "drunkdial",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "postgres",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Export the sequelize instance
const db = {
  sequelize,
  Sequelize,
};

// Import models
db.User = require("./user.model");
db.Connection = require("./connection.model");
db.Call = require("./call.model");

// Setup model relationships
db.User.hasMany(db.Connection, { foreignKey: "user_id" });
db.Connection.belongsTo(db.User, { foreignKey: "user_id" });

db.User.hasMany(db.Call, { foreignKey: "caller_id", as: "CallerCalls" });
db.User.hasMany(db.Call, { foreignKey: "receiver_id", as: "ReceiverCalls" });
db.Call.belongsTo(db.User, { foreignKey: "caller_id", as: "Caller" });
db.Call.belongsTo(db.User, { foreignKey: "receiver_id", as: "Receiver" });

module.exports = db;
