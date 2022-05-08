const { Client, Intents, MessageEmbed } = require("discord.js");

const { verifyHolder } = require("./discord.verify");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.once("ready", () => {
  console.log("punkkub-discord is ready");
});

client.login(process.env.punkkubBotToken);

client.on("messageCreate", async (message) => {
  await verifyHolder(message, client);
});

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
