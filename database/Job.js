const { Model, DataTypes } = require("sequelize");
const sequelize = require("./database");

class Job extends Model {}

Job.init(
  {
    jobId: {
      type: DataTypes.STRING,
    },
    owner: {
      type: DataTypes.STRING,
    },
    tokenIds: {
      type: DataTypes.ARRAY(DataTypes.NUMBER),
    },
    status: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
    modelName: "Job",
  }
);

module.exports = Job;
