const Queue = require("bee-queue");
const chalk = require("chalk");
const { ethers } = require("ethers");
const contract = require("../addresses.json");

const tokensMinting = new Queue("TokenMinting");
const options = {
  gasPrice: ethers.utils.parseUnits("20", "gwei"),
  gasLimit: 5500000,
};

const BKCMainnetUrl = process.env.MUMBAI;
const BKCPrivateKey = process.env.PRIVATE_KEY;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl);
const BKCWallet = new ethers.Wallet(BKCPrivateKey);
const BKCAccount = BKCWallet.connect(BKCProvider);

const BSCMainnetUrl = process.env.RINKEBY;
const BSCPrivateKey = process.env.PRIVATE_KEY;
const BSCProvider = new ethers.providers.JsonRpcProvider(BSCMainnetUrl);
const BSCWallet = new ethers.Wallet(BSCPrivateKey);
const BSCAccount = BSCWallet.connect(BSCProvider);

const homeContract = new ethers.Contract(
  contract.home_bridge,
  [
    "function getLockedTokensOf(address _owner) view returns(uint256[] memory)",
    "function returnLockedTokensBackTo(address _owner, uint256[] memory _tokenId)",
    "function updateMintedTokensOf(address _owner, uint256[] memory _tokenIds)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BKCAccount
);

const foreignContract = new ethers.Contract(
  contract.foreign_bridge,
  [
    "function updateLockedTokensOf(address _owner, uint256[] _tokenIds)",
    "function mintTokensOf(address _owner) payable",
    "function resetLockedInfoOf(address _owner, uint256[] _tokenIds)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

async function checkLockedTokensInHome(owner, tokenIds) {
  console.log(
    "[mintingQueue]==> check if tokens have already been locked in home contract ?"
  );
  let currentNonce = await BKCAccount.getTransactionCount();
  console.log(`[mintingQueue]==> current nonce: [${currentNonce}]`);
  let tx = await homeContract.getLockedTokensOf(owner);
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

async function updateLockedTokensInForeign(owner, tokenIds) {
  console.log(
    "[mintingQueue]==> update foreign to let it recognize locking tokens at home"
  );
  let currentNonce = await BSCAccount.getTransactionCount();
  console.log(`[mintingQueue]==> current Nonce: [${currentNonce}]`);
  await foreignContract.updateLockedTokensOf(owner, tokenIds);
}

async function mintTokensOf(owner, tokenIds) {
  console.log("[mintingQueue]==> token minting get called");
  let currentNonce = await BSCAccount.getTransactionCount();
  console.log(`[mintingQueue]==> current Nonce: [${currentNonce}]`);
  const tx = await foreignContract.mintTokensOf(owner, options);

  return tx;
}

async function updateMintedTokensInHome(owner, tokenIds) {
  console.log("[mintingQueue]==> update minted token at home");
  let currentNonce = await BKCAccount.getTransactionCount();
  console.log(`[mintingQueue]==> Current Nonce: [${currentNonce}]`);
  await homeContract.updateMintedTokensOf(owner, tokenIds, options);
}

async function handleFailedMinting(owner, tokenIds) {
  console.log("[mintingQueue]==> reset foreign contract info for", owner);
  // BSCManager.incrementTransactionCount();
  const resetTx = await foreignContract.resetLockedInfoOf(owner, tokenIds);
  const resetHomeReceipt = await resetTx.wait();
  console.log("[mintingQueue]==> reset: ", resetHomeReceipt);

  // BKCManager.incrementTransactionCount();
  const returnTx = await homeContract.returnLockedTokensBackTo(owner, tokenIds);
  const returnReceipt = await returnTx.wait();
  console.log("[mintingQueue]==> return: ", returnReceipt);

  console.log("[mintingQueue]==> please repeat all process again.");
  console.log("[mintingQueue]==> owner address: ", owner);
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
      const haveToken = await checkLockedTokensInHome(owner, tokens);
      if (haveToken) {
        await updateLockedTokensInForeign(owner, tokens);
        return await mintTokensOf(owner, tokens, options);
      } else {
        console.log(
          chalk.red("[mintingQueue]=> error cannot mint tokens for ", owner)
        );
      }
    })
    .then(async (tx) => {
      await tx.wait();
      console.log(
        chalk.redBright("[mintingQueue]==> minting tx-hash:", tx.hash)
      );
      console.log("[mintingQueue]==> updating minted tokens in home contract");
      await updateMintedTokensInHome(owner, tokens, options);
      job.reportProgress(100);
    })
    .catch((error) => {
      console.log(`[mintingQueue]=> ${error}`);
      console.log(
        "[MintingQueue]=> error cannot mint!!, something went wrong with minting process."
      );
      handleFailedMinting(owner, tokens);
    })
    .finally(() => {
      console.log("[mintingQueue]=> done...");
      console.log("========================\n");
      done();
    });
});
