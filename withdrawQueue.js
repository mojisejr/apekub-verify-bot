const Queue = require('bee-queue');
const ethers = require('ethers');
const chalk = require('chalk');

const withdrawQ = new Queue('withdraw');

// BSC
const BSCMainnetUrl = process.env.BSC_MAINNET_URL
const BSCPrivateKey = process.env.PRIVATE_KEY;
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

console.log("WTF");
withdrawQ.process(1, async (job,done) => {
    console.log(JSON.stringify(job));
})

// withdraw.process(function (job, done) {
//     console.log(JSON.stringify(job));

//     let address = job.data.address;
//     let amount = job.data.amount;

//     setTimeout(() => console.log("Getting withdraw queue"), 1000);
//     setTimeout(() => {
//         console.log("Preparing ... ");
//         job.reportProgress(10);
//     }, 1000);

//     setTimeout(() => {
//         withdrawXVon(address, amount)
//         job.reportProgress(100);
//         done();
//     }, 2000);
// });

const withdrawXVon = async (address, amountOut) => {
    console.log(chalk.yellow("withdrawXVon"));
    console.log(chalk.yellow(`address : ${address}`));
    console.log(chalk.yellow(`amountOut : ${amountOut}`));
    const txWithdraw = await BSCexpressContracts.withdraw(address, amountOut);
    console.log(chalk.yellow(`tx : ${txWithdraw.hash}`))
}