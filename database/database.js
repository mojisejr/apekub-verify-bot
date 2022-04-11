const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("job-db", "user", "pass", {
  dialect: "sqlite",
  host: "./job.sqlite",
});

module.exports = sequelize;
