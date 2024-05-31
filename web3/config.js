import WalletConnectProvider from '@walletconnect/web3-provider';

const buyAddress = process.env.buyAddress; // I put the buyAddress in node env
const usdtAddress = process.env.usdtAddress; // I put the usdtAddress in node env
const busdAddress = process.env.busdAddress; // I put the busdAddress in node env
const transactionHashAddress = process.env.transactionHashAddress; // I put the transactionHashAddress in node env
const ChainId = process.env.ChainId; // I put the ChainId in node env
//
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.infuraId, // I put the infuraId in node env
    },
  },
};

//networkParams
const networkParams = {
  '0x38': {
    chainId: '0x38',
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    chainName: 'Binance Smart Chain',
    nativeCurrency: { name: 'BNB', decimals: 18, symbol: 'BNB' },
    blockExplorerUrls: ['https://bscscan.com'],
  },
  '0x4': {
    chainId: '0x4',
    rpcUrls: ['https://rinkeby.infura.io/v3/'],
    chainName: 'Rinkeby',
    nativeCurrency: { name: 'RinkebyETH', decimals: 18, symbol: 'RinkebyETH' },
    blockExplorerUrls: ['https://rinkeby.etherscan.io'],
  },
  '0x5': {
    chainId: '0x5',
    rpcUrls: ['https://goerli.infura.io/v3/'],
    chainName: 'Goerli',
    nativeCurrency: { name: 'GoerliETH', decimals: 18, symbol: 'GoerliETH' },
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  },
};

const PINATA_API_KEY = process.env.PINATA_API_KEY; // I put the PINATA_API_KEY in node env
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY; // I put the PINATA_SECRET_API_KEY in node env

export {
  buyAddress,
  providerOptions,
  PINATA_API_KEY,
  PINATA_SECRET_API_KEY,
  busdAddress,
  usdtAddress,
  transactionHashAddress,
  ChainId,
  networkParams,
};
