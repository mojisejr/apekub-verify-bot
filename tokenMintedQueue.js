const { NonceManager } = require("@ethersproject/experimental");
const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers, BigNumber } = require("ethers");

const tokensMinting = new Queue("tokensMinted");
const options = { gasPrice: 10e18, gasLimit: 5500000, nonce: 0 };

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
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

async function checkReceivedTokensInHome(owner, tokenIds) {
  console.log("[mintingQueue]==> check token at home");
  let currentNonce = await BKCAccount.getTransactionCount();
  console.log(`[mintingQueue]==> Current Nonce: [${currentNonce}]`);
  let tx = await homeContract.getReceivedTokensOf(owner);
  let tokensFromHome = tx
    .toString()
    .split(",")
    .map((token) => parseInt(token));

  console.log("input", tokenIds);
  console.log("compare", tokensFromHome);

  const result = JSON.stringify(tokensFromHome) === JSON.stringify(tokenIds);
  if (!result) {
    return false;
  } else {
    return true;
  }
}

async function updateReceivedTokensInForeign(owner, tokenIds) {
  console.log("[mintingQueue]==> update checked at foreign");
  let currentNonce = await BSCAccount.getTransactionCount();
  console.log(`[mintingQueue]==> Current Nonce: [${currentNonce}]`);
  await foreignContract.updateHomeTransferredTokensOf(owner, tokenIds);
}

async function mintTokensOf(owner, tokenIds) {
  console.log("[mintingQueue]==> token minting called");
  //wait for 4 nonce to finalize previous transaction before burn
  //increase transaction count by 1
  BSCManager.incrementTransactionCount();
  let currentNonce = await BSCAccount.getTransactionCount();
  console.log(`[mintingQueue]==> Current Nonce: [${currentNonce}]`);
  const tx = await foreignContract.mintTokensOf(owner, {
    gasPrice: ethers.utils.parseUnits("3", "gwei"),
    gasLimit: 5500000,
  });

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
        return await mintTokensOf(owner, tokens, options);
      } else {
        console.log(
          chalk.red("[mintingQueue]=> Error cannot mint tokens for ", owner)
        );
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
