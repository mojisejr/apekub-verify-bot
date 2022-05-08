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

client.once("ready", async () => {
  console.log("punkkub-discord is ready");
});

client.login(process.env.punkkubBotToken);

client.on("messageCreate", async (message) => {
  await checkVerifyHolder(message, client);
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
