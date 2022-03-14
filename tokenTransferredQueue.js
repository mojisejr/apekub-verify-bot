const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers } = require("ethers");
const { NonceManager } = require("@ethersproject/experimental");

const tokenTransfering = new Queue("tokenTransferred");

const options = {
  gasPrice: ethers.utils.parseUnits("20", "gwei"),
  gasLimit: 5500000,
};

//option 2
//using getGasPrice from provider and add some more

//option 3
//try to use increase nonce again

const BKCMainnetUrl = process.env.MUMBAI;
const BKCPrivateKey = process.env.PRIVATE_KEY;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);
const BKCWallet = new ethers.Wallet(BKCPrivateKey);
const BKCAccount = BKCWallet.connect(BKCProvider);
const BKCManager = new NonceManager(BKCAccount);

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
    "function checkBurnedTokensOf(address _owner) view returns(bool)",
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
    "function getTokensToMintOf(address _owner) view returns(uint256[] memory)",
    "function transferTokensTo(address _owner)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

// async function checkIfTokensBurnedInHome(owner) {
//   console.log(
//     "[tokensTransferred]==> check if tokens have already burned before transfer to owner"
//   );
//   let currentNonce = await BKCAccount.getTransactionCount();
//   console.log(`[tokenTransferred]==> Current Nonce: [${currentNonce}]`);
//   const result = await homeContract.checkBurnedTokensOf(owner);
//   if (result) {
//     return true;
//   } else {
//     return false;
//   }
// }

async function transferTokensTo(owner) {
  console.log("[tokensTransferingQueue]==> transfer token to ", owner);
  //increse transaction count by 1
  // BSCManager.incrementTransactionCount();
  let currentNonce = await BSCAccount.getTransactionCount();
  console.log(`[tokenTransferingQueue]==> Current Nonce: [${currentNonce}]`);
  const tx = await foreignContract.transferTokensTo(owner, options);

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

tokenTransfering.process(2, function (job, done) {
  // console.log(job);
  let owner = job.data.address;
  let tokens = job.data.tokenIds;

  console.log(`[tokensTransferingQueue]=> - owner : ${owner}`);
  console.log("[tokensTransferingQueue]=> - tokens : ", tokens);

  reportProgress(job, 10, "[tokensTransferingQueue]=> Preparing..")
    .then(async () => {
      // const result = await checkIfTokensBurnedInHome(owner);
      // if (result) {
      return await transferTokensTo(owner, options);
      // } else {
      // console.log(
      //   chalk.red(
      //     "[tokensTransferingQueue]=> Error cannot transfer token to",
      //     owner
      //   )
      // );
      // }
    })
    .then((tx) => {
      console.log(
        chalk.redBright(
          "[tokensTransferingQueue]==> transfering tx-hash:",
          tx.hash
        )
      );
      job.reportProgress(100);
    })
    .catch((error) => {
      console.log("[tokensTransferingQueue]=> trasfering failed for", owner);
      console.error(error);
    })
    .finally(() => {
      console.log("[tokensTransferingQueue]=> done...");
      console.log("========================\n");
      done();
    });
});
