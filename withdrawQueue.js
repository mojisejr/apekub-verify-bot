const Queue = require('bee-queue');
const ethers = require('ethers');
const chalk = require('chalk');

const options = {
    redis: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
    },
}

const ethersOptions = {
    gasLimit: 50000,
    gasPrice: ethers.utils.parseUnits('5', 'gwei')
};

const withdraw = new Queue('withdraw');

// BSC
const BSCMainnetUrl = process.env.BSC_MAINNET_URL
const BSCPrivateKey = process.env.PRIVATE_KEY_BSC;
const BSCProvider = new ethers.providers.JsonRpcProvider(BSCMainnetUrl)
const BSCWallet = new ethers.Wallet(BSCPrivateKey);
const BSCAccount = BSCWallet.connect(BSCProvider);

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

const withdrawXVon = async (address, amountOut) => {
    console.log(chalk.yellow("withdrawXVon"));
    console.log(chalk.yellow(`address : ${address}`));
    console.log(chalk.yellow(`amountOut : ${amountOut}`));
    try {
        const txWithdraw = await BSCexpressContracts.withdraw(
            address,
            amountOut,
            {
                gasLimit: 70000
            });
        txWithdraw.wait();
        console.log(chalk.yellow(`tx : ${txWithdraw.hash}`))
        return txWithdraw
    } catch (error) {
        return error
    }
}

const reportProgress = (job, number, msg) => {
    return new Promise((resolve, reject) => {
        console.log(msg)
        job.reportProgress(number).then((res) => {
            resolve(res)
        }).catch((err) => reject(err))
    })
}

withdraw.process(1, function (job, done) {
    let address = job.data.address;
    let amount = job.data.amount;
    console.log(`[withdrawQueue] - address : ${address}`);
    console.log(`[withdrawQueue] - amount : ${amount}`);

    reportProgress(job, 10, 'Preparing')
        .then(() => {
            return withdrawXVon(address, amount)
        }).then((error) => {
            // Call create queue burn after tx error
            console.log("Error : ", error);
            let order = {
                address: job.data.address,
                amount: job.data.amount.toString()
            }
            placeBurnQueue(order)
                .then((job) => console.log(`Add burnQueue done ${job.id}`))
                .catch((error) => console.log(`Add burnQueue Error : ${error}`));
        }).then(() => {
            return job.reportProgress(100)
        }).finally(() => {
            console.log("Done ...");
            done()
        });
});
