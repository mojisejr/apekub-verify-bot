const Queue = require('bee-queue');

const withdrawQueue = new Queue('withdraw', { isWorker: false});

const burnQueue = new Queue('burn', { isWorker: false });

const placeWithdrawQueue = async (order) => {
  const job = await withdrawQueue.createJob(order)
    .retries(5)
    .save();
  return job;
};

const placeBurnQueue = (order) => {
  return burnQueue.createJob(order)
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