import Web3Modal from 'web3modal';
import Web3 from 'web3';
import { providerOptions, networkParams } from './config';
import ENV from './ENV'; // I don't give this component. use my code: https://github.com/MrVincentP/GetUserDeviceInformation
export default {
  web3: null,
  provider: null,
  hasConnected: false,
  web3Modal(){
    return new Web3Modal({
      theme: 'dark',
      network: 'mainnet',
      //cacheProvider: true, // optional
      //disableInjectedProvider: true,
      providerOptions,
    });
  },
  async init(type, userWalletAddress, callback){
    //console.log(process.env.ChainId)
    try {
      this.provider = await this.web3Modal().connect()
    } catch(connectError){
      return callback && callback({ err: -1, data: connectError });
    }
    console.log('this.provider:::', this.provider);
    this.web3 = new Web3(this.provider); // Wallet instance
    console.log('this.web3:::', this.web3);
    console.log('ENV:::', ENV);
    // ENV.env = 'mobile / pc' // use yourself functions, or use my code: https://github.com/MrVincentP/GetUserDeviceInformation
    // ENV.env === 'mobile' && this.web3.currentProvider.isMetamask // Mobile web3 browser, metamask, imtoken, etc
    // ENV.env === 'pc' && this.web3.currentProvider.isMetamask // The process of awakening the metamask on the PC
    //!this.web3.currentProvider.isMetamask // Scan the code on the PC or use a mobile browser to trigger the metamask
    if(type === 'connectWallet' && ENV.env === 'pc' && this.web3.currentProvider.isMetaMask){
      console.log('1');
      //await this.subscribeProvider(callback); // event subscriptions
      const permissions = await this.web3.eth.currentProvider.request({
        method: 'wallet_requestPermissions',
        params: [{
          'eth_accounts': {
            requiredMethods: ['signTypedData_v4'],
          },
        }],
      });
      console.log('2');
      console.log(permissions)
    }
    console.log('3');
    await this.checkNetwork({
      targetChain: process.env.ChainId, // this is the blockchain id, I put it in my node env
      callback: callback, // this is the callback function
      userWalletAddress, // this is the wallet address by user,
      type, // this is the step for wallet
    });
  },
  /** Check the wallet link network **/
  async checkNetwork(obj){
    let res = { ok: false, data: null }
    if (this.web3.eth && this.web3.eth.currentProvider) {
      console.log('4');
      let provider = this.web3.eth.currentProvider;
      try {
        /** Select target network **/
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: this.toHex(obj.targetChain) }],
        });
        console.log('5:', provider);
        // Mobile web3 browser, PC end calling up metamask etc., will have the isMetaMask field
        if(provider.isMetaMask){
          res = { ok: true, data: provider.selectedAddress };
        } else {
          res = { ok: true, data: provider.accounts[0] }; // if the user has more than one wallet address, you should select the top one.
        }
      } catch (switchError) {
        console.log('switchError::', switchError)
        /** User Rejected **/
        if (switchError.code === 4001) {
          res.data = switchError.message;
        }
        /** Without this network, you should add it. **/
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [networkParams[this.toHex(obj.targetChain)]],
            });
            // Mobile web3 browser, PC end calling up metamask etc., will have the isMetaMask field
            if(provider.isMetaMask){
              res = { ok: true, data: provider.selectedAddress };
            } else {
              res = { ok: true, data: provider.accounts[0] };  // if the user has more than one wallet address, you should select the top one.
            }
          } catch (addError) {
            console.log('addError::', addError)
            /** User Rejected **/
            res.data = addError.message;
          }
        }
      }
    }
    /** User refuses to switch networks **/
    if (!res.ok) {
      return obj.callback && obj.callback({ err: -1, data: res.data });
    }
    console.log('6');
    obj.userWalletAddress = obj.userWalletAddress && obj.userWalletAddress.toUpperCase() || '';
    let networkId = await this.web3.eth.net.getId();
    let chainId = await this.web3.eth.getChainId();
    console.log('res:::', res);
    let params = {
      web3: this.web3,
      provider: this.provider,
      connected: true,
      userAddress: res.data,
      chainId: chainId,
      networkId: networkId,
    }
    /** buy a node **/
    if(obj.type === 'buyNodes'){
      return await this.buyNodesSteps(obj, params);
    }
    /** connect wallet **/
    if(obj.type === 'connectWallet'){
      this.hasConnected = true;
      return await this.connectWallet(obj, params);
    }
  },
  /** buy nodes steps **/
  async buyNodesSteps(obj, params){
    /** Bound, wallet address, inconsistent judgment switch **/
    if(obj.userWalletAddress && obj.userWalletAddress !== params.userAddress.toUpperCase()){
      console.log(obj, params);
      return obj.callback && obj.callback({ err: -2, data: '' });
    }
    /** Bound, Connected **/
    if (obj.userWalletAddress) {
      return obj.callback && obj.callback({ err: 0, data: params });
    }
    /** Unbound, connected **/
    if (!obj.userWalletAddress) {
      return obj.callback && obj.callback({ err: 1, data: params });
    }
  },
  /** connect wallet success **/
  connectWallet(obj, params){
    return obj.callback && obj.callback({ err: 0, data: params });
  },
  /** Decimal to hexadecimal conversion **/
  toHex(num) {
    const val = Number(num);
    return '0x' + val.toString(16);
  },
  getUserBalance(userAddress){
    return this.web3.eth.getBalance(userAddress).then((res) => (res ? this.web3.utils.fromWei(res.toString(), 'ether') : 0))
  },
  async getSignature(token, userAddress){
    return await this.web3.eth.personal.sign(token, userAddress);
  },
  async getAccountAssets(){
    this.fetching = true;
    try {
      this.assets = await this.getUserBalance();
      this.fetching = false;
    } catch (error) {
      this.fetching = false;
    }
  },
  async subscribeProvider(fn){
    if(this.hasConnected){
      return;
    }
    /** Network disconnection monitoring **/
    this.provider.on('disconnect', async() => {
      console.log('Disconnected')
      await this.resetApp();
    });
    /** Account switching listening **/
    this.provider.on('accountsChanged', async (accounts) => {
      console.log('Account switching', accounts);
      return fn && fn({ err: 2, data: accounts });
    });
    /** Chain switching listening **/
    this.provider.on('chainChanged', async (chainId) => {
      console.log('Chain switching', chainId);
      return fn && fn({ err: 3, data: chainId });
    });
  },
  async resetApp(){
    if (this.web3 && this.web3.eth && this.web3.eth.currentProvider && this.web3.eth.currentProvider.close) {
      await this.web3.eth.currentProvider.close();
    }
    this.web3Modal().clearCachedProvider();
  },
  /** Add currency **/
  async addWalletAsset(obj){
    console.log('addWalletAsset::', obj);
    if (this.web3.eth && this.web3.eth.currentProvider) {
      let provider = this.web3.eth.currentProvider;
      try {
        /** Select target network **/
        let param = {
          type: 'ERC20', // contract name
          options: {
            address: obj.contract, // contract address
            symbol: obj.symbol, // currency symbol
            decimals: Math.log(obj.decimals) * Math.LOG10E, // currency decimals
            image: obj.image, // currency icon
          },
        }
        await provider.request({
          method: 'wallet_watchAsset',
          params: param,
        });
        return obj.callback && obj.callback({ err: 0 });
      } catch (switchError) {
        console.log('switchError::', switchError)
        return obj.callback && obj.callback({ err: -1 });
      }
    }
  },
};
