/**
 * since no need to burn token after get claimed at the foreign
 * this queue is get ignore but left it like this in case of needed
 */
const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers } = require("ethers");

const tokensBurning = new Queue("TokenBurning");

const contract = require("../addresses.json");

const { updateJobState } = require("./database/database.service");
const STATUS = require("./index");

const options = {
  gasPrice: ethers.utils.parseUnits("20", "gwei"),
  gasLimit: 5500000,
};

const BKCMainnetUrl = process.env.MUMBAI;
const BKCPrivateKey = process.env.PRIVATE_KEY;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);
const BKCWallet = new ethers.Wallet(BKCPrivateKey);
const BKCAccount = BKCWallet.connect(BKCProvider);

const homeContract = new ethers.Contract(
  contract.home_bridge,
  [
    "function getLockedTokensOf(address _owner) view returns(uint256[] memory)",
    "function updateMintedTokensOf(address _owner, uint256[] calldata _tokenIds)",
    "function burnTokensOf(address _owner)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensLocked(uint256[] _tokenIds, address indexed _owner)",
  ],
  BKCAccount
);

async function burnTokensOf(owner) {
  console.log("[burningQueue]==> burning token called");
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

tokensBurning.process(function (job, done) {
  let owner = job.data.address;
  let tokens = job.data.tokenIds;

  console.log(`[burningQueue]=> - owner : ${owner}`);
  console.log("[burningQueue]=> - tokens : ", tokens);

  reportProgress(job, 10, "[burningQueue]=> Preparing..")
    .then(async () => {
      return await burnTokensOf(owner, options);
    })
    .then((tx) => {
      console.log(
        chalk.redBright("[burningQueue]==> burning tx-hash:", tx.hash)
      );
      job.reportProgress(100);
    })
    .catch((error) => {
      console.log(
        chalk.redBright(
          "[burningQueue]==> burning failed, may be using manual method"
        )
      );
    })
    .finally(() => {
      console.log("[burningQueue]=> done...");
      console.log("========================\n");
      done();
    });
});
