const { Client, Intents, MessageEmbed } = require("discord.js");

const { checkVerifyHolder } = require("./discord.verify");

const intents = new Intents();

intents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGES
);

const client = new Client({
  intents,
});

const ethers = require("ethers");
const BKCMainnetUrl = process.env.bitkubMainnet;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);
const { giveRole, takeRole } = require("./discord.role");
const { getHolderBalance } = require("./discord.verify");
const {
  getDataByWallet,
  updateVerificationStatus,
} = require("./csv/verify.service");

const punkkub = new ethers.Contract(
  process.env.punkkub,
  [
    "function tokenURI(uint256 _tokenId) view returns(string memory)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  ],
  BKCProvider
);

client.once("ready", async () => {
  console.log("punkkub-discord is ready");
});

client.login(process.env.punkkubBotToken);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  //format data
  const inputData = {
    wallet: interaction.options.data[0].value,
    discordId: interaction.user.id,
    discordName: interaction.user.tag,
    timestamp: Date.now(),
  };

  //verify check
  await checkVerifyHolder(inputData, client, interaction);
});

//tracking transfer event for give discord user a role and nickname
punkkub.on("Transfer", async (from, to, tokenId) => {
  if (isMarketPlace(to)) {
    await onTransferUpdateRole(from);
  } else if (isMarketPlace(from)) {
    await onTransferUpdateRole(to);
  } else {
    await onTransferUpdateRole(to);
    await onTransferUpdateRole(from);
  }
});

async function onTransferUpdateRole(wallet) {
  const holderData = await getDataByWallet(wallet);
  const balance = await getHolderBalance(wallet);
  if (balance > 0 && holderData && holderData.wallet == wallet) {
    console.log(`@${wallet} : is holder.`);
    await giveRole(client, holderData.discordId);
    await updateVerificationStatus(wallet, true);
  } else if (balance <= 0 && holderData && holderData.wallet == wallet) {
    console.log(`@${wallet} : is NOT holder`);
    await takeRole(client, holderData.discordId);
    await updateVerificationStatus(wallet, false);
  } else {
    console.log(`transfer from non-verified holder. @${wallet}`);
  }
}

//check if receiver is marketplace
function isMarketPlace(to) {
  let marketPlaceAddress = "0x874987257374cAE9E620988FdbEEa2bBBf757cA9";
  let middleAddress = "0xA51b0F76f0d7d558DFc0951CFD74BB85a70E2a95";

  if (to === marketPlaceAddress || to === middleAddress) {
    return true;
  } else {
    return false;
  }
}

function createPunkkubEmbedForListed(title, uri, listedTime) {
  const embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(title)
    .setImage(uri)
    .setFooter({
      text: listedTime,
    });
  return embed;
}

function createPunkkubEmbedForSold(title, uri, listedTime) {
  const embed = new MessageEmbed()
    .setColor("#B20600")
    .setTitle(title)
    .setImage(uri)
    .setFooter({
      text: listedTime,
    });
  return embed;
}

module.exports = {
  bot: client,
  createPunkkubEmbedForListed: createPunkkubEmbedForListed,
  createPunkkubEmbedForSold: createPunkkubEmbedForSold,
};
