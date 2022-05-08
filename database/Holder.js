const { Model, DataTypes } = require("sequelize");
const sequelize = require("./database");

class PunkHolder extends Model {}

PunkHolder.init(
  {
    discordId: {
      type: DataTypes.STRING,
    },
    walletAddress: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.INTEGER,
    },
    verified: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    sequelize,
    modelName: "PunkHolder",
  }
);

module.exports = PunkHolder;
