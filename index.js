require('dotenv').config();
require('./burnQueue');
require('./withdrawQueue');

const ethers = require('ethers');
const express = require('express');
const chalk = require('chalk');
const http = require('http');

const { placeWithdrawQueue, placeBurnQueue } = require('./placeQueue');

const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

const PORT = 5000;

const options = { gasPrice: 10e18, gasLimit: 5500000, nonce: 0 };

// BKC
const BKCMainnetUrl = process.env.BKC_MAINNET_URL
const BKCPrivateKey = process.env.PRIVATE_KEY;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl)
const BKCWallet = new ethers.Wallet(BKCPrivateKey);
const BKCAccount = BKCWallet.connect(BKCProvider);

// BSC
const BSCMainnetUrl = process.env.BSC_MAINNET_URL
const BSCPrivateKey = process.env.PRIVATE_KEY;
const BSCProvider = new ethers.providers.JsonRpcProvider(BSCMainnetUrl)
const BSCWallet = new ethers.Wallet(BSCPrivateKey);
const BSCAccount = BSCWallet.connect(BSCProvider);

let nonceCount = 1;

const BKCexpressContracts = new ethers.Contract(
  process.env.BKC_EXPRESS_ADDRESS,
  [
    'function withdraw(address _receiver, uint256 _amount)',
    'function burn(uint256 _amountBurn)',
    'event Deposit(address, address, uint256);',
    'event Withdraw(address, address, uint256);'
  ],
  BKCAccount
);

const BSCexpressContracts = new ethers.Contract(
  process.env.BSC_EXPRESS_ADDRESS,
  [
    'function withdraw(address _receiver, uint256 _amount)',
    'function burn(uint256 _amountBurn)',
    'event Deposit(address, address, uint256);',
    'event Withdraw(address, address, uint256);'
  ],
  BSCAccount
);

const run = async () => {
  // hook deposit
  BKCexpressContracts.on('Deposit', async (tx, sender, amount) => {
    let order1 = {
      address: sender,
      amount: amount.toString()
    }

    console.log('Processing Transaction Deposit');
    console.log(chalk.green(`tx: ${tx}`));
    console.log(chalk.green(`sender: ${sender}`));
    console.log(chalk.green(`amountIn: ${amount}`));

    // Call create queue withdraw
    // withdrawXVon(sender, amount)

    let order2 = {
      address: sender,
      amount: amount.toString()
    }

    console.log("order1 : ", JSON.stringify(order1));
    console.log("order2 : ", JSON.stringify(order2));
    placeWithdrawQueue(JSON.parse(JSON.stringify(order1)))
      .then((job) => console.log(`Add withdrawQueue done ${job.id}`))
      .catch((error) => console.log(`Add withdrawQueue Error : ${error}`));
  });

  BSCexpressContracts.on('Withdraw', async (tx, sender, amount) => {
    console.log('Processing Transaction Withdraw');
    console.log(chalk.blueBright(`tx: ${tx}`));
    console.log(chalk.blueBright(`sender: ${sender}`));
    console.log(chalk.blueBright(`amountIn: ${amount}`));

    // Call create queue burn
    let order = {
      address: sender,
      amount: amount.toString()
    }
    placeBurnQueue(order)
      .then((job) => console.log(`Add burnQueue done ${job.id}`))
      .catch((error) => console.log(`Add burnQueue Error : ${error}`));
  });
}

run();

const server = http.createServer(app);
server.listen(PORT , () => {
  console.log(chalk.yellow("Start Service"));
});


