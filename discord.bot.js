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

client.once("ready", async () => {
  console.log("apekub-discord is ready");
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

module.exports = {
  bot: client,
};
