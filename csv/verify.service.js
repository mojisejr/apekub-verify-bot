const {
  addVerifiedPunk,
  updatePunkVerificationState,
  getPunkByDiscordName,
  getPunkByWallet,
} = require("../database/firestore");

async function getDataByWallet(wallet) {
  const result = await getPunkByWallet(wallet);
  return result;
}

async function getDataByDiscord(discord) {
  const result = await getPunkByDiscordName(discord);
  return result;
}

async function updateVerificationStatus(wallet, status) {
  updatePunkVerificationState(wallet, status);
  console.log(`@${wallet} verification status updated to ${status}`);
}

async function saveVerifiedData({
  wallet,
  discordName,
  discordId,
  timestamp,
  lastbalance,
  verified,
}) {
  const isVerified = await getDataByDiscord(discordName);
  console.log("isVerified before save: ", isVerified);
  if (isVerified) {
    console.log("address already registered");
    return false;
  }

  await addVerifiedPunk({
    wallet,
    discordName,
    discordId,
    lastbalance,
    timestamp,
    verified,
  }).then(() => {
    console.log(`@${wallet} passed and saved to database`);
  });

  return true;
}

module.exports = {
  getDataByWallet,
  getDataByDiscord,
  updateVerificationStatus,
  saveVerifiedData,
};
