const sequelize = require("./database");
const PunkHolder = require("./Holder");

async function saveVerifiedHolder({
  discordId,
  walletAddress,
  timestamp,
  verified,
}) {
  const newHolder = await PunkHolder.create({
    discordId,
    walletAddress,
    timestamp,
    verified,
  });

  console.log("newHolder", newHolder.toJSON());

  return newHolder.toJSON();
}

async function updateHolderStatus({ walletAddress, verifiedValue }) {
  await PunkHolder.update(
    { verified: verifiedValue },
    {
      where: {
        walletAddress,
      },
    }
  );

  const updated = await PunkHolder.findAll({
    where: {
      walletAddress,
    },
  });

  console.log("updated: ", updated[0]);

  return updated[0];
}

async function getHolderByDiscordId(discordId) {
  const found = await PunkHolder.findAll({
    where: {
      discordId,
    },
  });

  return found[0].dataValues;
}

async function getHolderByWallet(walletAddress) {
  const found = await PunkHolder.findAll({
    where: {
      walletAddress,
    },
  });

  console.log("found by walletAddress", found[0].dataValues);
  return found[0].dataValues;
}

module.exports = {
  saveVerifiedHolder,
  updateHolderStatus,
  getHolderByDiscordId,
  getHolderByWallet,
};
