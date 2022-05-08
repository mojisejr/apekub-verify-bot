const { ethers } = require("ethers");

const channelId = "965474646499663954";

// const sequelize = require("./database/database");

// database is here
// const {
//   saveVerifiedHolder,
//   updateHolderStatus,
//   getHolderByDiscordId,
//   getHolderByWallet,
// } = require("./database/database.service");
// sequelize.sync().then(() => console.log("punkkub-database is ready"));
const {
  getDataByDiscord,
  getDataByWallet,
  saveVerifiedData,
  updateVerificationStatus,
} = require("./csv/verify.service");

const BKCMainnetUrl = process.env.bitkubMainnet;
// const BKCMainnetUrl = process.env.bitkubTestnet;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);

const punkkub = new ethers.Contract(
  process.env.punkkub,
  // process.env.testNFT,
  [
    "function tokenURI(uint256 _tokenId) view returns(string memory)",
    "function balanceOf(address _owner) view returns(uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  ],
  BKCProvider
);

//Verification Main function is here
async function verifyHolder(message, client) {
  await checkVerifyHolder(message, client);
}

//Check if holder have the right of verification
async function checkVerifyHolder(message, client) {
  console.log("bot", bot);
  if (message.author.bot) {
    return;
  }
  const address = await getHolderAddress(message);
  if (address == null) return;
  let sender = {
    id: message.author.id,
    timestamp: message.createdTimestamp,
    address,
  };

  const verified = await isVerified(sender);

  const balance = await getHolderBalance(sender.address);

  if (balance > 0 && !verified) {
    //set user as verified holder
    // saveVerifiedHolder({
    //   discordId: sender.id,
    //   walletAddress: sender.address,
    //   timestamp: sender.timestamp,
    //   verified: true,
    // });
    const result = await saveVerifiedData({
      wallet: sender.address,
      discord: sender.id,
      timestamp: sender.timestamp,
      lastbalance: balance,
      verified: true,
    });
    if (result) {
      console.log(`@${sender.address} verification done!`);
      sendBackMessage(
        `@${message.author.username} ยินต้อนรับ! พังค์พวกกก !! คุณเป็นพวกเราแล้ว! [New Punker!]`,
        client
      );
    } else {
      //update to verified again
      console.log(
        `found address: @${
          sender.address
        } update verification status to: ${true}`
      );
      sendBackMessage(
        `@${message.author.username} ยินดีต้อนรับกลับมา พังค์พวก !! [Welcome Back!]`,
        client
      );
      updateVerificationStatus(sender.address, true);
    }
  } else {
    console.log(`@${sender.address} is verified. `);
    sendBackMessage(
      `@${message.author.username} คุณเป็นชาวพังค์แล้วนะ !! [Its Ok~]`,
      client
    );
  }
}

//send message back to client
function sendBackMessage(message, client) {
  const channel = client.channels.cache.get(channelId);
  channel.send(message);
}

//check if use send the verification command and their valid address
function getHolderAddress(message) {
  const verifyCommand = "!guPunk";
  let [command, address] = message.content.split(" ");
  if (isCommand(message, verifyCommand)) {
    console.log("verifying address: ", address);
    return isValidAddress(address);
  } else {
    return null;
  }
}

//check if valid address was sent
function isValidAddress(address) {
  let isAddress = address.slice(0, 2);
  if (isAddress == "0x") {
    return address;
  } else {
    return null;
  }
}

//check the command in struction
function isCommand(message, commandType) {
  let [command] = message.content.split(" ");
  return command === commandType;
}

//get the balance of punk in use wallet
async function getHolderBalance(address) {
  if (address != null) {
    const tokenOfOwner = await punkkub.balanceOf(address);
    return parseInt(tokenOfOwner.toString());
  } else {
    return 0;
  }
}

async function isVerified(sender) {
  // const { verified } = await getHolderByDiscordId(sender.id);
  const data = await getDataByDiscord(sender.id);

  if (data != null) {
    return data.verified === "true";
  } else {
    return false;
  }
}

// //holder object
// //discordId
// //walletId
// //timestamp
// //lastBalance
// //verified: true, false

//tracking transfer event for give discord user a role and nickname
punkkub.on("Transfer", async (from, to, tokenId) => {
  if (isMarketPlace(to)) {
  }

  if (isMarketPlace(from)) {
  }
});

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

module.exports = {
  verifyHolder,
};
