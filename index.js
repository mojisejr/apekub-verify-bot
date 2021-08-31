import ethers from 'ethers';
import express from 'express';
import chalk from 'chalk';
import Sequelize from 'sequelize';

const app = express();

const sequelize = new Sequelize('postgres://postgres:syspass@localhost:5432/vonder');

sequelize.define('transaction', {
})

const PORT = 5000;

const data = {
  express: {
    BKC: '0x48AC444f395BC00907Efff79691B08d1e2e1296a', // Mainnet
    BSC: '0xE16f1b620123eF93B4Bb9B4fe5903E90BCb30588', // Testnet
  },
  AMOUNT_OF_WBNB: '0.02',
  Slippage: '3', //in Percentage
  gasPrice: '50', //in gwei
  // gasLimit : '345684' //at least 21000
  gasLimit: '200000'
}

const options = { gasPrice: 10e18, gasLimit: 5500000};

// BKC
const BKCMainnetUrl = 'https://rpc.bitkubchain.io'
const BKCPrivateKey = '280e49399d195e0a01b61d55210baa56020d7f0341c1ff752ea596a2d9732eec';
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl)
const BKCWallet = new ethers.Wallet(BKCPrivateKey);
const BKCAccount = BKCWallet.connect(BKCProvider);

// BSC
const BSCMainnetUrl = 'https://data-seed-prebsc-1-s2.binance.org:8545'
const BSCPrivateKey = '280e49399d195e0a01b61d55210baa56020d7f0341c1ff752ea596a2d9732eec';
const BSCProvider = new ethers.providers.JsonRpcProvider(BSCMainnetUrl)
const BSCWallet = new ethers.Wallet(BSCPrivateKey);
const BSCAccount = BSCWallet.connect(BSCProvider);

const BKCexpressContracts = new ethers.Contract(
  data.express.BKC,
  [
    'function withdraw(address _receiver, uint256 _amount)',
    'function burn(uint256 _amountBurn)',
    'event Deposit(address, address, uint256);',
    'event Withdraw(address, address, uint256);'
  ],
  BKCAccount
);

const BSCexpressContracts = new ethers.Contract(
  data.express.BSC,
  [
    'function withdraw(address _receiver, uint256 _amount)' ,
    'function burn(uint256 _amountBurn)',
    'event Deposit(address, address, uint256);',
    'event Withdraw(address, address, uint256);'
  ],
  BSCAccount
);


const run = async () => {
  console.log("Start running bot...")

  // try {
  //   await sequelize.authenticate();
  //   console.log('Connection has been established successfully.');
  // } catch (error) {
  //   console.error('Unable to connect to the database:', error);
  // }

  //Ex
  //We buy x amount of the new token for our wbnb
  // const amountIn = ethers.utils.parseUnits(`${data.AMOUNT_OF_WBNB}`, 'ether');
  // const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);

  // hook deposit
  BKCexpressContracts.on('Deposit', async (tx, sender, amount) => {
    console.log(this);
    console.log('Processing Transaction.....');
    console.log(chalk.yellow(`tx: ${tx}`));
    console.log(chalk.yellow(`sender: ${sender}`));
    console.log(chalk.yellow(`amountIn: ${amount}`));

    // Call Withdraw
    withdrawXVon(sender, amount)
  });

  BSCexpressContracts.on('Withdraw', async (tx, sender, amount) => {
    console.log('Processing Transaction.....');
    console.log(chalk.yellow(`tx: ${tx}`));
    console.log(chalk.yellow(`sender: ${sender}`));
    console.log(chalk.yellow(`amountIn: ${amount}`));

    // Call Withdraw
    burnVon(sender, amount)
  });
}

run();

app.listen(PORT, (console.log(chalk.yellow("Start Service"))));

// function call 
const withdrawXVon = async (address, amountOut) => {
  console.log(chalk.yellow("withdrawXVon"));
  console.log(chalk.yellow(`address : ${address}`));
  console.log(chalk.yellow(`amountOut : ${amountOut}`));
  const txWithdraw = await BSCexpressContracts.withdraw(address, amountOut.toString());
  console.log(chalk.yellow(`tx : ${txWithdraw}`))
}

const burnVon = async (address, amountOut) => {
  console.log(chalk.red("burnVon"));
  console.log(chalk.red(`address : ${address}`));
  console.log(chalk.red(`amountOut : ${amountOut}`));
  const txBurn = await BKCexpressContracts.burn(amountOut.toString());
  console.log(chalk.red(`tx : ${txBurn}`));
}

// function save to DB
// save 

