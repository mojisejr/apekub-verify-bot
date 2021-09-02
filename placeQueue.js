const Queue = require('bee-queue');

const options = {
  removeOnSuccess: true,
  redis: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
  },
}

const withdrawQueue = new Queue('withdraw', options);

const burnQueue = new Queue('burn', options);

const placeWithdrawQueue = (withdrawQueueData) => {
  console.log(JSON.stringify(withdrawQueueData));
  const job = withdrawQueue.createJob(withdrawQueueData)
    .retries(5)
    .save();
  console.log(JSON.stringify(job));
  return job;
};

const placeBurnQueue = (burnQueueData) => {
  return burnQueue.createJob(burnQueueData)
    .retries(5)
    .save();
};

withdrawQueue.on("succeeded", (job) => {
  // Notify the client via push notification, web socket or email etc.
  console.log(`🧾 ${job.data} ready 😋`);
});

burnQueue.on("succeeded", (job) => {
  // Notify the client via push notification, web socket or email etc.
  console.log(`🧾 ${job.data} ready 😋`);
});



module.exports = {
  placeWithdrawQueue: placeWithdrawQueue,
  placeBurnQueue: placeBurnQueue
};