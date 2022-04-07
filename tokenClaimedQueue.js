const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers } = require("ethers");
const contract = require("../addresses.json");

const tokensClaimed = new Queue("TokenClaimed");

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
    "function updateClaimedTokensOf(address _owner, uint256[] calldata _tokenIds)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensLocked(uint256[] _tokenIds, address indexed _owner)",
  ],
  BKCAccount
);

async function updateClaimedState(owner, tokenIds) {
  console.log("[claimedQueue]==> claimed status updating called");
  let currentNonce = await BKCAccount.getTransactionCount();
  console.log(`[claimedQueue]==> Current Nonce: [${currentNonce}]`);
  const tx = await homeContract.updateClaimedTokensOf(owner, tokenIds, options);
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

tokensClaimed.process(function (job, done) {
  let owner = job.data.address;
  let tokens = job.data.tokenIds;

  console.log(`[claimedQueue]=> - owner : ${owner}`);
  console.log("[claimedQueue]=> - tokens : ", tokens);

  reportProgress(job, 10, "[claimedQueue]=> Preparing..")
    .then(async () => {
      return await updateClaimedState(owner, tokens);
    })
    .then(async (tx) => {
      await tx.wait();
      console.log(
        chalk.redBright(
          "[claimedQueue]==> claimed status updated: tx-hash:",
          tx.hash
        )
      );
      job.reportProgress(100);
    })
    .catch((error) => {
      console.log(
        chalk.redBright(
          "[claimedQueue]==> claimed status updating failed, may be using manual method"
        )
      );
    })
    .finally(() => {
      console.log("[claimedQueue]=> done...");
      console.log("========================\n");
      done();
    });
});
