const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("punkkub-db", "user", "pass", {
  dialect: "sqlite",
  host: "./punkkub.sqlite",
});

module.exports = sequelize;
