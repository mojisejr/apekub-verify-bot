const Queue = require("bee-queue");

const tokensMintingQueue = new Queue("TokenMinting", {
  isWorker: false,
});

const tokenBurningQueue = new Queue("TokenBurning", { isWorker: false });

const tokenClaimedQueue = new Queue("TokenClaimed", { isWorker: false });

function placeTokensMintingQueue(order) {
  return tokensMintingQueue.createJob(order).retries(5).save();
}

function placeTokensBurningQueue(order) {
  return tokenBurningQueue.createJob(order).retries(5).save();
}

function placeTokensClaimedQueue(order) {
  return tokenClaimedQueue.createJob(order).retries(5).save();
}

tokensMintingQueue.on("succeeded", (job) => {
  console.log(`🧾 ${job.data} ready 😋`);
});

tokenBurningQueue.on("succeeded", (job) => {
  console.log(`🧾 ${job.data} ready 😋`);
});

tokenClaimedQueue.on("succeeded", (job) => {
  console.log(`🧾 ${job.data} ready 😋`);
});

module.exports = {
  placeTokensMintingQueue: placeTokensMintingQueue,
  placeTokensBurningQueue: placeTokensBurningQueue,
  placeTokensClaimedQueue: placeTokensClaimedQueue,
};
