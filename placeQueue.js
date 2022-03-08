const Queue = require("bee-queue");

const tokensMintedQueue = new Queue("tokensMinted", {
  isWorker: false,
});

const tokenBurnedQueue = new Queue("tokensBurned", { isWorker: false });

const tokensTransferredQueue = new Queue("tokenTransferred", {
  isWorker: false,
});

function placeTokensMintedQueue(order) {
  return tokensMintedQueue.createJob(order).retries(5).save();
}

function placeTokensBurnedQueue(order) {
  return tokenBurnedQueue.createJob(order).retries(5).save();
}

function placeTokensTransferredQueue(order) {
  return tokenBurnedQueue.createJob(order).retries(5).save();
}

tokensMintedQueue.on("succeeded", (job) => {
  console.log(`🧾 ${job.data} ready 😋`);
});

tokenBurnedQueue.on("succeeded", (job) => {
  console.log(`🧾 ${job.data} ready 😋`);
});

tokensTransferredQueue.on("succeeded", (job) => {
  console.log(`🧾 ${job.data} ready 😋`);
});

module.exports = {
  placeTokensMintedQueue: placeTokensMintedQueue,
  placeTokensBurnedQueue: placeTokensBurnedQueue,
  placeTokensTransferredQueue: placeTokensTransferredQueue,
};
