require("dotenv").config({
  path: "config.env",
});

require("./tokenMintedQueue");
require("./tokenBurnedQueue");
require("./tokenTransferredQueue");

const ethers = require("ethers");
const express = require("express");
const chalk = require("chalk");
const http = require("http");
const {
  placeTokensMintedQueue,
  placeTokensBurnedQueue,
  placeTokensTransferredQueue,
} = require("./placeQueue");

const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

const PORT = 1234;

const options = { gasPrice: 10e18, gasLimit: 5500000, nonce: 0 };

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

let nonceCount = 1;

const foreignContract = new ethers.Contract(
  process.env.BRIDGE_FOREIGN_ADDRESS,
  ["event TokensMinted(uint256[] _tokenIds, address indexed _owner)"],
  BSCAccount
);

const homeContract = new ethers.Contract(
  process.env.BRIDGE_HOME_ADDRESS,
  [
    "function withdraw(address _receiver, uint256 _amount)",
    "function updateAndTransferTokensOf(address _owner)",
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensTransferred(uint256[] _tokenIds, address indexed _owner)",
    "event TokensBurned(uint256[] _tokenIds, address indexed _owner)",
  ],
  BKCAccount
);

const run = async () => {
  homeContract.on("TokensTransferred", async (tx, sender) => {
    console.log(chalk.yellowBright("1) Processing Transaction Token Minting"));
    const tokens = tx
      .toString()
      .split(",")
      .map((x) => parseInt(x));
    console.log("owner: ", sender);
    console.log("tokens: ", tokens);

    let order = {
      address: sender,
      tokenIds: tokens,
    };

    placeTokensMintedQueue(order)
      .then((job) =>
        console.log(
          chalk.greenBright(
            `[controller]=> Add tokenMintedQueue done ${job.id}`
          )
        )
      )
      .catch((error) =>
        console.log(`[controller]=> Add TokenMintedQueue Error ${error}`)
      );
  });

  foreignContract.on("TokensMinted", async (tx, sender) => {
    const tokens = tx
      .toString()
      .split(",")
      .map((x) => parseInt(x));
    console.log(
      chalk.yellowBright("2) Processing Transaction Tokens Transfering")
    );
    console.log("owner: ", sender);
    console.log("tokens: ", tokens);
    // foreign update home trasferredTokenOf to reconize the receiving

    let order = {
      address: sender,
      tokenIds: tokens,
    };

    placeTokensTransferredQueue(order)
      .then((job) =>
        console.log(
          chalk.greenBright(
            `[controller]=> Add TokensTransferredQueue [transfer to owner] done ${job.id}`
          )
        )
      )
      .catch((error) =>
        console.log(
          `[controller]=> Add TokensTransferredQueue [transfer to owner] Error ${error}`
        )
      );
  });

  homeContract.on("TokensBurned", async (tx, sender) => {
    const tokens = tx
      .toString()
      .split(",")
      .map((x) => parseInt(x));
    console.log(chalk.yellowBright("3) Processing Transaction Token Burning"));
    console.log("owner: ", sender);
    console.log("tokens: ", tokens);
    // foreign update home trasferredTokenOf to reconize the receiving

    let order = {
      address: sender,
      tokenIds: tokens,
    };

    placeTokensBurnedQueue(order)
      .then((job) =>
        console.log(
          chalk.greenBright(`[controller]=> Add TokensBurned done ${job.id}`)
        )
      )
      .catch((error) =>
        console.log(`[controller]=> Add TokensBurned Error ${error}`)
      );
  });
};

run();

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(
    chalk.blueBright(
      "==== nft Bridge is now live ====",
      new Date().toDateString()
    )
  );
});
