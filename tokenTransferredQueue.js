const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers } = require("ethers");

const tokensBurning = new Queue("tokensBurned");

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
    "function updateMintedTokensOf(address _owner, uint256[] calldata _tokenIds)",
    "function burnTokensOf(address _owner)",
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
    "function getTokensToMintOf(address _owner) view returns(uint256[] memory)",
    "function transferTokensTo(address _owner)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

async function transferTokensTo(owner) {
  console.log("[tokensTransferred]==> transfer token to ", owner);
  const tx = await foreignContract.transferTokensTo(owner);
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

tokensBurning.process(function (job, done) {
  // console.log(job);
  let owner = job.data.address;
  let tokens = job.data.tokenIds;

  console.log(`[tokensTrasferingQueue]=> - owner : ${owner}`);
  console.log("[tokensTrasferingQueue]=> - tokens : ", tokens);

  reportProgress(job, 10, "[tokensTrasferingQueue]=> Preparing..")
    .then(async () => {
      return await transferTokensTo(owner);
    })
    .then((tx) => {
      console.log(
        chalk.redBright(
          "[tokensTrasferingQueue]==> transfering tx-hash:",
          tx.hash
        )
      );
      job.reportProgress(100);
    })
    .finally(() => {
      console.log("[tokensTrasferingQueue]=> done...");
      console.log("========================\n");
      done();
    });
});
