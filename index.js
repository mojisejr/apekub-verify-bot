import ethers from 'ethers';
import express from 'express';
import chalk from 'chalk';

const app = express();

const data = {
  WBNB: '0x67eBD850304c70d983B2d1b93ea79c7CD6c3F6b5', //wbnb 
  to_PURCHASE: '0x19dade57B0BBCE7D5E859ba02846820f5c0c2b09',  // VonderToken
  factory: '0x447DdE468Fb3B185d395D8D43D82D6636d69d481',  //Vonder V2 factory
  router: '0x54D851C39fE28b2E24e354B5E8c0f09EfC65B51A', //Vonder V2 router
  recipient: '0x4D27D0c531Bd634D5A26f219596b84f171002FB1', //THE Deployer,
  AMOUNT_OF_WBNB : '0.2',
  Slippage : '3', //in Percentage
  gasPrice : '5', //in gwei
  gasLimit : '345684' //at least 21000
}

let initialLiquidityDetected = false;

const bscMainnetUrl = 'https://rpc.bitkubchain.io/'
// const mnemonic = '';
const privateKey = '778c8ab3ef982c03b7a972dc3f63293f20fb61991e7bcbf53ef3aea70763a50c';
const provider = new ethers.providers.JsonRpcProvider(bscMainnetUrl)
// const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const wallet = ethers.Wallet(privateKey);
const account = wallet.connect(provider);

const factory = new ethers.Contract(
  data.factory,
  ['function getPair(address tokenA, address tokenB) external view returns (address pair)'],
  account
);

const router = new ethers.Contract(
  data.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

const run = async () => {
  const tokenIn = data.WBNB;
  const tokenOut = data.to_PURCHASE;
  const pairAddress = await factory.getPair(tokenIn, tokenOut);

  console.log(pairAddress);

  const pair = new ethers.Contract(pairAddress, ['event Mint(address indexed sender, uint amount0, uint amount1)'], account);

  pair.on('Mint', async (sender, amount0, amount1) => {
    if(initialLiquidityDetected === true) {
        return;
    }

    initialLiquidityDetected = true;

   //We buy x amount of the new token for our wbnb
   const amountIn = ethers.utils.parseUnits(`${data.AMOUNT_OF_WBNB}`, 'ether');
   const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
 
   //Our execution price will be a bit different, we need some flexbility
   const amountOutMin = amounts[1].sub(amounts[1].div(`${data.Slippage}`)); 
 
   console.log(
    chalk.green.inverse(`Liquidity Addition Detected\n`)
     +
     `Buying Token
     =================
     tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
     tokenOut: ${amountOutMin.toString()} ${tokenOut}
   `);

   console.log('Processing Transaction.....');
   console.log(chalk.yellow(`amountIn: ${amountIn}`));
   console.log(chalk.yellow(`amountOutMin: ${amountOutMin}`));
   console.log(chalk.yellow(`tokenIn: ${tokenIn}`));
   console.log(chalk.yellow(`tokenOut: ${tokenOut}`));
   console.log(chalk.yellow(`data.recipient: ${data.recipient}`));
   console.log(chalk.yellow(`data.gasLimit: ${data.gasLimit}`));
   console.log(chalk.yellow(`data.gasPrice: ${ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')}`));

   const tx = await router.swapExactTokensForTokens(
     amountIn,
     amountOutMin,
     [tokenIn, tokenOut],
     data.recipient,
     Date.now() + 1000 * 60 * 10, //10 minutes
     {
       'gasLimit': data.gasLimit,
       'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
   });
 
   const receipt = await tx.wait(); 
   console.log('Transaction receipt');
   console.log(receipt);
  });
}

run();

const PORT = 5000;

app.listen(PORT, (console.log(chalk.yellow(`Listening for Liquidity Addition to token ${data.to_PURCHASE}`))));