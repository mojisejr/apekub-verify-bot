const { Client, Intents, MessageEmbed } = require("discord.js");

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once("ready", () => {
  console.log("punkkub bot v1 is ready");
});

client.login(process.env.punkkubBotToken);

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
