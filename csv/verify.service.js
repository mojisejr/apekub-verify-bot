const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvtojson = require("csvtojson/v2");
const csvFilePath = process.cwd() + "/csv/verified.csv";

async function getDataByWallet(wallet) {
  const dataArray = await csvtojson().fromFile(csvFilePath);

  const found = dataArray.find((data) => data.wallet == wallet);

  if (found) {
    return found;
  } else {
    return null;
  }
}

async function getDataByDiscord(discord) {
  const dataArray = await csvtojson().fromFile(csvFilePath);
  const found = dataArray.find((data) => data.discord == discord);

  if (found) {
    return found;
  } else {
    return null;
  }
}

async function updateVerificationStatus(wallet, status) {
  const dataArray = await csvtojson().fromFile(csvFilePath);
  const updated = dataArray.map((data) => {
    if (data.wallet == wallet) {
      return {
        ...data,
        verified: status,
      };
    } else {
      return data;
    }
  });
  const result = await saveUpdatedData(updated);
  console.log(`@${wallet} verification status updated to ${status}`);
  return result;
}

async function saveUpdatedData(dataToSave = []) {
  if (dataToSave.length <= 0) {
    return false;
  } else {
    const writer = createWriter(false);
    writer.writeRecords(dataToSave).then(() => {});
    return true;
  }
}

// //holder object
// //discordId
// //walletId
// //timestamp
// //lastBalance
// //verified: true, false
async function saveVerifiedData({
  wallet,
  discord,
  timestamp,
  lastbalance,
  verified,
}) {
  const isVerified = await getDataByDiscord(discord);
  console.log("isVerified before save: ", isVerified);
  if (isVerified) {
    console.log("address already registered");
    return false;
  }

  const writer = createWriter();
  const dataToSave = [{ wallet, discord, timestamp, lastbalance, verified }];
  writer.writeRecords(dataToSave).then(() => {
    console.log(`@${wallet} passed and saved to database`);
  });
  return true;
}

function createWriter(append = true) {
  const options = {
    path: csvFilePath,
    header: [
      {
        id: "wallet",
        title: "wallet",
      },
      {
        id: "discord",
        title: "discord",
      },
      {
        id: "timestamp",
        title: "timestamp",
      },
      {
        id: "lastbalance",
        title: "lastbalance",
      },
      {
        id: "verified",
        title: "verified",
      },
    ],
    append,
  };
  return createCsvWriter(options);
}

module.exports = {
  getDataByWallet,
  getDataByDiscord,
  updateVerificationStatus,
  saveVerifiedData,
};
