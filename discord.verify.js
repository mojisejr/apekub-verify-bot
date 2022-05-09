const { ethers } = require("ethers");

const {
  getDataByDiscord,
  saveVerifiedData,
  updateVerificationStatus,
} = require("./csv/verify.service");

const { giveRole, takeRole } = require("./discord.role");

const BKCMainnetUrl = process.env.bitkubMainnet;
// const BKCMainnetUrl = process.env.bitkubTestnet;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);

const punkkub = new ethers.Contract(
  process.env.punkkub,
  // process.env.testNFT,
  [
    "function tokenURI(uint256 _tokenId) view returns(string memory)",
    "function balanceOf(address _owner) view returns(uint256)",
  ],
  BKCProvider
);

//Check if holder have the right of verification
async function checkVerifyHolder(message, client) {
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
      await giveRole(client, sender.id);
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
      await giveRole(client, sender.id);
    }
  } else if (balance > 0 && verified) {
    console.log(`@${sender.address} is verified. `);
    sendBackMessage(
      `@${message.author.username} คุณเป็นชาวพังค์แล้วนี่นา !! [Already Verified!]`,
      client
    );
  } else {
    console.log(`@${sender.address} has no punk!`);
    sendBackMessage(
      `@${message.author.username} คุณต้องมี punkkub ในกระเป๋าก่อนนะ ค่อยมา verify [Invalid balance]`,
      client
    );
  }
}

//send message back to client
function sendBackMessage(message, client) {
  const channel = client.channels.cache.get(process.env.channelId);
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
  let isAddress = address.split("0x");
  if (
    isAddress[0] == "" &&
    isAddress[1].length == 40 &&
    isAddress.length == 2
  ) {
    return address;
  } else {
    console.log("invalid address");
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

//check if the sender is verified
async function isVerified(sender) {
  const data = await getDataByDiscord(sender.id);

  if (data != null) {
    return data.verified === "true";
  } else {
    return false;
  }
}

module.exports = {
  checkVerifyHolder,
  getHolderBalance,
};
