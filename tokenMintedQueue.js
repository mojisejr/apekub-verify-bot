const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers } = require("ethers");
const { placeTokensBurnedQueue } = require("./placeQueue");

const tokensMinting = new Queue("tokensMinted");

// const BKCMainnetUrl = process.env.LOCAL_RPC;
// const BKCPrivateKey = process.env.PRIVATE_KEY;
// const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);
// const BKCWallet = new ethers.Wallet(BKCPrivateKey);
// const BKCAccount = BKCWallet.connect(BKCProvider);

const BSCMainnetUrl = process.env.LOCAL_RPC;
const BSCPrivateKey = process.env.PRIVATE_KEY;
const BSCProvider = new ethers.providers.JsonRpcProvider(BSCMainnetUrl);
const BSCWallet = new ethers.Wallet(BSCPrivateKey);
const BSCAccount = BSCWallet.connect(BSCProvider);

const homeContract = new ethers.Contract(
  process.env.BRIDGE_HOME_ADDRESS,
  [
    "function getReceivedTokensOf(address _owner) view returns(uint256[] memory)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

const foreignContract = new ethers.Contract(
  process.env.BRIDGE_FOREIGN_ADDRESS,
  [
    "function updateHomeTransferredTokensOf(address _owner, uint256[] _tokenIds)",
    "function mintTokensOf(address _owner) payable",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

async function checkReceivedTokensInHome(owner, tokenIds) {
  console.log("[mintingQueue]==> check token at home");
  let tx = await homeContract.getReceivedTokensOf(owner);
  let tokensFromHome = tx
    .toString()
    .split(",")
    .map((token) => parseInt(token));

  const result = JSON.stringify(tokensFromHome) === JSON.stringify(tokenIds);
  if (!result) {
    return false;
  } else {
    return true;
  }
}

async function updateReceivedTokensInForeign(owner, tokenIds) {
  console.log("[mintingQueue]==> update checked at foreign");
  await foreignContract.updateHomeTransferredTokensOf(owner, tokenIds);
}

async function mintTokensOf(owner, tokenIds) {
  console.log("[mintingQueue]==> token minting called");
  let totalPrice = tokenIds.length * 0.01;
  console.log("[mintingQueue]===> total minting price", totalPrice);
  totalPrice = ethers.utils.parseEther(totalPrice.toString());

  const tx = await foreignContract.mintTokensOf(owner, { value: totalPrice });
  return tx;
}

function reportProgress(job, number, msg) {
  return new Promise((resolve, reject) => {
    console.log(msg);
    job
      .reportProgress(number)
      .then((res) => {
        resolve(res);
      })
      .catch((error) => reject(error));
  });
}

//process minting work
tokensMinting.process(1, function (job, done) {
  // console.log(job);
  let owner = job.data.address;
  let tokens = job.data.tokenIds;

  console.log(`[mintingQueue]=> - owner : ${owner}`);
  console.log("[mintingQueue]=> - tokens : ", tokens);

  reportProgress(job, 10, "[mintingQueue]=> Preparing..")
    .then(async () => {
      //do checking and minting process here
      const result = await checkReceivedTokensInHome(owner, tokens);
      if (result) {
        await updateReceivedTokensInForeign(owner, tokens);
        return await mintTokensOf(owner, tokens);
      }
    })
    .then((tx) => {
      console.log(
        chalk.redBright("[mintingQueue]==> minting tx-hash:", tx.hash)
      );
      job.reportProgress(100);
    })
    .finally(() => {
      console.log("[mintingQueue]=> done...");
      console.log("========================\n");
      done();
    });
});
