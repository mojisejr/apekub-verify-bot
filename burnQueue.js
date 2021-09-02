const Queue = require('bee-queue');
const ethers = require('ethers');
const chalk = require('chalk');

const options = {
    redis: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
    },
}

// BKC
const BKCMainnetUrl = process.env.BKC_MAINNET_URL
const BKCPrivateKey = process.env.PRIVATE_KEY;
const BKCProvider = new ethers.providers.JsonRpcProvider(BKCMainnetUrl)
const BKCWallet = new ethers.Wallet(BKCPrivateKey);
const BKCAccount = BKCWallet.connect(BKCProvider);

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

const burnQueue = new Queue('burn');

burnQueue.process(10, (job, done) => {
    let address = job.data.address;
    let amount = job.data.amount;

    setTimeout(() => console.log("Getting withdraw queue"), 1000);
    setTimeout(() => {
        console.log("Preparing ... ");
        job.reportProgress(10);
    }, 1000);

    setTimeout(() => {
        burnVon(address, amount)
        job.reportProgress(100);
        done();
    }, 2000);
});


const burnVon = async (address, amountOut) => {
    console.log(chalk.red("burnVon"));
    console.log(chalk.red(`address : ${address}`));
    console.log(chalk.red(`amountOut : ${amountOut}`));
    const txBurn = await BKCexpressContracts.burn(amountOut);
    console.log(chalk.red(`tx : ${txBurn.hash}`));
}