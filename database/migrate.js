// require("dotenv").config({ path: "./config.env" });
// const csvtojson = require("csvtojson/v2");
// const { Client, Intents } = require("discord.js");

// const intents = new Intents();

// intents.add(
//   Intents.FLAGS.GUILDS,
//   Intents.FLAGS.GUILD_MEMBERS,
//   Intents.FLAGS.GUILD_MESSAGES
// );

// const client = new Client({
//   intents,
// });

// const { Collection, db } = require("./firestore");
// const basePath = process.cwd();

// client.login(process.env.punkkubBotToken);
// client.once("ready", async () => {
//   const output = await formatData();
//   await saveToFirestore(output);
// });
// //1 read verified.csv to json
// //2 get disocordName from discordId
// //3 format data object
// //4 save to database

// async function read() {
//   const filepath = `${basePath}/database/verified.csv`;
//   const dataArray = await csvtojson().fromFile(filepath);
//   return dataArray;
// }

// async function getDiscordNameFromDiscordId(discordId) {
//   const list = client.guilds.cache.get(process.env.guildId);
//   const tag = await list.members.fetch().then((data) => {
//     console.log("formatting: ", discordId);
//     return data.filter((d) => d.id == discordId).map((m) => m.user.tag)[0];
//   });
//   return tag;
// }

// async function formatData() {
//   console.log("=== format data processing... ===");
//   const punkData = await read();
//   const output = await Promise.all(
//     punkData.map(async (punk) => {
//       const tagName = await getDiscordNameFromDiscordId(punk.discord);
//       return {
//         wallet: punk.wallet,
//         discordName: tagName,
//         discordId: punk.discord,
//         timestamp: punk.timestamp,
//         lastbalance: punk.lastbalance,
//         verified: punk.verified,
//       };
//     })
//   );
//   return output;
// }

// async function saveToFirestore(data = []) {
//   console.log("data length", data.length);
//   console.log("saving to firestore ..");
//   if (data.length <= 0) throw new Error("data array is empty");
//   data.forEach(async (punk) => {
//     if (punk.discordName === undefined) return;
//     console.log("saveing: ", punk.discordName);
//     const { wallet, discordName, discordId, timestamp, lastbalance, verified } =
//       punk;
//     await Collection.Holder.doc(wallet).set({
//       discordId,
//       discordName,
//       timestamp,
//       lastbalance,
//       verified,
//     });
//   });
// }
