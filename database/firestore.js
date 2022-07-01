const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key.replace(/\\n/g, "\n"),
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url,
  }),
});

//using firestore
const db = admin.firestore();

//firestore collection reference
const Collection = {
  Holder: db.collection("holder"),
};

async function addVerifiedPunk(punkData) {
  const { wallet, discordName, discordId, timestamp, lastbalance, verified } =
    punkData;

  const response = await Collection.Holder.doc(wallet).set({
    discordName,
    discordId,
    lastbalance,
    timestamp,
    verified,
  });
  return response;
}

async function updatePunkVerificationState(wallet, status) {
  await Collection.Holder.doc(wallet).update({
    verified: status,
  });
}

async function getAllVerifiedPunk() {
  const response = await Collection.Holder.get();
  let allPunk = [];
  response.forEach((punk) => {
    allPunk.push({ wallet: punk.id, ...punk.data() });
  });

  if (allPunk.length <= 0) {
    throw new Error("database is empty");
  }

  return allPunk;
}

async function getPunkByDiscordName(discordName) {
  const allPunk = await getAllVerifiedPunk();
  const found = allPunk.find((punk) => punk.discordName == discordName);

  if (found) {
    return found;
  } else {
    return null;
  }
}

async function getPunkByWallet(wallet) {
  const allPunk = await getAllVerifiedPunk();
  const found = allPunk.find((punk) => punk.wallet == wallet);

  if (found) {
    return found;
  } else {
    return null;
  }
}

getPunkByWallet("0x27ea0d98E5876b70377d6d921DAE987BE48A7A2c");

module.exports = {
  addVerifiedPunk,
  updatePunkVerificationState,
  getPunkByDiscordName,
  getPunkByWallet,
};
