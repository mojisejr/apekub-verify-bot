const sequelize = require("./database");
const Job = require("./Job");

async function createNewJob({ jobId, owner, tokenIds, status }) {
  const createdJob = await Job.create({
    jobId,
    owner,
    tokenIds,
    status,
  });

  console.log("job created", createdJob.toJSON());

  return createdJob.toJSON();
}

async function updateJobState({ jobId, status }) {
  await Job.update(
    { status },
    {
      where: {
        jobId,
      },
    }
  );

  const updated = await Job.findAll({
    where: {
      jobId,
    },
  });

  console.log("updated: ", updated[0]);

  return updated[0];
}

module.exports = {
  createNewJob,
  updateJobState,
};
