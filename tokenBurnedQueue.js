const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers } = require("ethers");
const { NonceManager } = require("@ethersproject/experimental");

const tokensBurning = new Queue("tokensBurned");

const options = {
  gasPrice: ethers.utils.parseUnits("20", "gwei"),
  gasLimit: 5500000,
};

const BKCMainnetUrl = process.env.MUMBAI;
const BKCPrivateKey = process.env.PRIVATE_KEY;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);
const BKCWallet = new ethers.Wallet(BKCPrivateKey);
const BKCAccount = BKCWallet.connect(BKCProvider);
const BKCManager = new NonceManager(BKCWallet);

const BSCMainnetUrl = process.env.RINKEBY;
const BSCPrivateKey = process.env.PRIVATE_KEY;
const BSCProvider = new ethers.providers.JsonRpcProvider(BSCMainnetUrl);
const BSCWallet = new ethers.Wallet(BSCPrivateKey);
const BSCAccount = BSCWallet.connect(BSCProvider);
const BSCManager = new NonceManager(BSCAccount);

const homeContract = new ethers.Contract(
  process.env.BRIDGE_HOME_ADDRESS,
  [
    "function getReceivedTokensOf(address _owner) view returns(uint256[] memory)",
    "function updateMintedTokensOf(address _owner, uint256[] calldata _tokenIds)",
    "function burnTokensOf(address _owner)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BKCAccount
);

const foreignContract = new ethers.Contract(
  process.env.BRIDGE_FOREIGN_ADDRESS,
  [
    "function updateHomeTransferredTokensOf(address _owner, uint256[] _tokenIds)",
    "function mintTokensOf(address _owner) payable",
    "function getTokensToTransferOf(address _owner) view returns(uint256[] memory)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

// async function checkMintedTokensInForeign(owner, tokenIds) {
//   console.log("[burningQueue]==> check minted token on foreign");
//   let tx = await foreignContract.getTokensToTransferOf(owner);
//   let tokensFromForeign = tx
//     .toString()
//     .split(",")
//     .map((token) => parseInt(token));

//   const result = JSON.stringify(tokensFromForeign) === JSON.stringify(tokenIds);
//   if (!result) {
//     return false;
//   } else {
//     return true;
//   }
// }

async function updateMintedTokensInHome(owner, tokenIds) {
  console.log("[burningQueue]==> update minted token at home");
  let currentNonce = await BKCAccount.getTransactionCount();
  console.log(`[burningQueue]==> Current Nonce: [${currentNonce}]`);
  await homeContract.updateMintedTokensOf(owner, tokenIds, options);
}

async function burnTokensOf(owner) {
  console.log("[burningQueue]==> burning token called");
  //wait for 4 nonce to finalize previous transaction before burn
  //increase transaction count by 1
  // BKCManager.incrementTransactionCount();
  let currentNonce = await BKCAccount.getTransactionCount();
  console.log(`[burningQueue]==> Current Nonce: [${currentNonce}]`);
  const tx = await homeContract.burnTokensOf(owner, options);
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

tokensBurning.process(3, function (job, done) {
  // console.log(job);
  let owner = job.data.address;
  let tokens = job.data.tokenIds;

  console.log(`[burningQueue]=> - owner : ${owner}`);
  console.log("[burningQueue]=> - tokens : ", tokens);

  reportProgress(job, 10, "[burningQueue]=> Preparing..")
    .then(async () => {
      // const result = await checkMintedTokensInForeign(owner, tokens);
      // if (result) {
      await updateMintedTokensInHome(owner, tokens);
      return await burnTokensOf(owner, options);
      // }
    })
    .then((tx) => {
      console.log(
        chalk.redBright("[burningQueue]==> burning tx-hash:", tx.hash)
      );
      job.reportProgress(100);
    })
    .finally(() => {
      console.log("[burningQueue]=> done...");
      console.log("========================\n");
      done();
    });
});
