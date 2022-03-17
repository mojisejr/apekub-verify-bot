require("dotenv").config({
  path: "config.env",
});

require("./tokenMintingQueue");
require("./tokenBurningQueue");

const ethers = require("ethers");
const express = require("express");
const chalk = require("chalk");
const http = require("http");
const {
  placeTokensMintingQueue,
  placeTokensBurningQueue,
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
  [
    "event TokensMinted(uint256[] _tokenIds, address indexed _owner)",
    "event TokensClaimed(uint256[] _tokenIds, address indexed _owner)",
  ],
  BSCAccount
);

const homeContract = new ethers.Contract(
  process.env.BRIDGE_HOME_ADDRESS,
  [
    "event TokensLocked(uint256[] _tokenIds, address indexed _owner)",
    "event TokensBurned(uint256[] _tokenIds, address indexed _owner)",
  ],
  BKCAccount
);

const run = async () => {
  homeContract.on("TokensLocked", async (tx, sender) => {
    console.log(
      chalk.yellowBright(
        "1) [Home]: Tokens are now locked, processing minting process."
      )
    );
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

    placeTokensMintingQueue(order)
      .then((job) =>
        console.log(
          chalk.greenBright(
            `[controller]=> Add tokenMintingQueue done ${job.id}`
          )
        )
      )
      .catch((error) =>
        console.log(`[controller]=> Add TokenMintingQueue error ${error}`)
      );
  });

  foreignContract.on("TokensMinted", async (tx, sender) => {
    const tokens = tx
      .toString()
      .split(",")
      .map((x) => parseInt(x));
    console.log(
      chalk.yellowBright(
        "2) [Foreign]: all tokens have been minted, ready to claim now"
      )
    );
    console.log("owner: ", sender);
    console.log("tokens: ", tokens);

    console.log("done...");
    console.log("========================\n");
  });

  foreignContract.on("TokensClaimed", async (tx, sender) => {
    const tokens = tx
      .toString()
      .split(",")
      .map((x) => parseInt(x));
    console.log(
      chalk.yellowBright(
        "3)[Foreign]: owner has already cliamed their tokens, Processing burning claimed token process."
      )
    );
    console.log("owner: ", sender);
    console.log("tokens: ", tokens);
    // foreign update home trasferredTokenOf to reconize the receiving

    let order = {
      address: sender,
      tokenIds: tokens,
    };

    placeTokensBurningQueue(order)
      .then((job) =>
        console.log(
          chalk.greenBright(`[controller]=> Add TokensBurning done ${job.id}`)
        )
      )
      .catch((error) =>
        console.log(`[controller]=> Add TokensBurning Error ${error}`)
      );
  });
};

homeContract.on("TokensBurned", async (tx, sender) => {
  const tokens = tx
    .toString()
    .split(",")
    .map((x) => parseInt(x));
  console.log(
    chalk.yellowBright(
      `4)[Home]: all tokens of ${sender} burned successfully. bridging process done.`
    )
  );
  console.log("owner: ", sender);
  console.log("tokens: ", tokens);

  console.log("done...");
  console.log("========================\n");
});

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
