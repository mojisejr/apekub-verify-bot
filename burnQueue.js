const Queue = require('bee-queue');
const ethers = require('ethers');
const chalk = require('chalk');

const options = {
    redis: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
    },
}

const burnQueue = new Queue('burn', options);

// BKC
const BKCMainnetUrl = process.env.BKC_MAINNET_URL
const BKCPrivateKey = process.env.PRIVATE_KEY_BKC;
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


const reportProgress = (job, number, msg) => {
    return new Promise((resolve, reject) => {
        console.log(msg)
        job.reportProgress(number).then((res) => {
            resolve(res)
        }).catch((err) => reject(err))
    })
}

burnQueue.process(function (job, done) {
    let address = job.data.address;
    let amount = job.data.amount;
    console.log(`[burnQueue] - address : ${address}`);
    console.log(`[burnQueue] - amount : ${amount}`);


    reportProgress(job, 10, 'Preparing')
        .then(() => {
            return burnVon(address, amount)
        }).then(() => {
            return job.reportProgress(100)
        }).finally(() => {
            console.log("Done ...");
            done()
        })
});


const burnVon = async (address, amountOut) => {
    console.log(chalk.red("burnVon"));
    console.log(chalk.red(`address : ${address}`));
    console.log(chalk.red(`amountOut : ${amountOut}`));
    const txBurn = await BKCexpressContracts.burn(amountOut);
    txBurn.wait();
    console.log(chalk.red(`tx : ${txBurn.hash}`));
}