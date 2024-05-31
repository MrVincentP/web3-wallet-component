import { busdAddress, usdtAddress, buyAddress } from '../config';
import BigNumber from 'bignumber.js';
import { ABI, USDT_API, NFT_API } from '../abi/abis';

export default {
  BUSDAddress: busdAddress, // BUSD contract address
  USDTAddress: usdtAddress, // USDT contract address
  userWalletAddress: null, // user Wallet Address
  web3: null, // Web3 instance
  currency: '', // 'busd', 'usdt'
  contract: null, // main contract
  approveContract: null, // Applying for a contract
  buyContract: null, // buy contract
  nftContract: null, // NFT contract
  init(userWalletAddress, web3, currency){
    this.web3 = web3;
    this.approveContract = new web3.eth.Contract(USDT_API, this[currency+'Address']);
    this.buyContract = new web3.eth.Contract(ABI, buyAddress);
    this.userWalletAddress = userWalletAddress;
  },
  initNft(userWalletAddress, nftAddress, web3){
    this.web3 = web3;
    this.nftContract = new web3.eth.Contract(NFT_API, nftAddress);
    this.userWalletAddress = userWalletAddress;
  },
  updateApproveContract(currency){
    this.approveContract = new this.web3.eth.Contract(USDT_API, this[currency+'Address']);
    //this.buyContract = new web3.eth.Contract(ABI, buyAddress);
  },
  allowance(){
    return this.approveContract.methods
      .allowance(this.userWalletAddress, buyAddress)
      .call({ from: this.userWalletAddress })
      .then((res) => {
        return new BigNumber(res).gt(0)
      });
  },
  getBalance(){
    return this.approveContract.methods.balanceOf(this.userWalletAddress).call().then((res) => {
      return this.web3.utils.fromWei(res); // etn 1**18
    });
  },
  approve(){
    return this.approveContract.methods
      .approve(buyAddress, this.web3.utils.toHex(this.web3.utils.toWei('1000000000000000000000000000', 'gwei')))
      .send({ from: this.userWalletAddress });
  },
  getTotalCost(count) {
    return this.buyContract.methods.getTotalCost(count).call().then((res) => {
      return this.web3.utils.fromWei(res);
    });
  },
  async buy(count, cost, upper='9999999', group='', isBusd) {
    //console.log('isBusd: ', isBusd);
    let _count = this.web3.utils.toHex(count);
    let _upper = this.web3.utils.toHex(upper);
    let _cost = this.web3.utils.toHex(this.web3.utils.toWei(cost));
    let _group = group;

    return this.buyContract.methods
      .buy(_count, _cost, _group, _upper, isBusd)
      .send({ from: this.userWalletAddress });
  },
  /** this code below is an example for query user's node and status **/
  async getTokensOf($API, $$){

    let liveList = [], blackIds = [], nodesList = [];
    let active = false, childrenNode = [], rs = {}, list = [], status = '';

    await Promise.all([$API.buyNodeGetOnlineList(),
      $API.buyNodeGetBlackList(),
      this.buyContract.methods.getTokensOf(this.userWalletAddress).call(),
    ]).then((res) => {
      liveList = res[0].data || [], blackIds = res[1].data || [], nodesList = res[2] || [];
    });
    let result = nodesList.map(async(node) => {
      if(blackIds.includes(parseInt(node))){
        return {
          parentNode: '',
          childrenNode: [],
          childrenLength: 0,
          disabled: true,
        }
      }
      active = liveList.includes(parseInt(node));
      childrenNode = [];
      childrenNode = await this.getDownList(node).then(data => {
        if(data.length){
          data = data.filter(child => {
            return !blackIds.includes(parseInt(child.id));
          });
          list = [];
          list = data.map( res => {
            status = 'off-line';
            if(liveList.includes(parseInt(res))){
              status = 'on-line';
            }
            rs = {
              id: res['id'],
              price: this.web3.utils.fromWei(res['price']) +'(USD)',
              date: $$.getYMDHMS(res['time']*1000),
              status,
            }
            return rs;
          });
          return list;
        }
        return data
      });
      let parentNode = await this.upMap(node);
      return {
        parentNode: parentNode === '0'? '-': parentNode,
        childrenNode,
        childrenLength: childrenNode.length,
        node,
        disabled: false,
        active,
        url: 'https://dpd5qvdshi3ge.cloudfront.net/erc721.png',
      }
    })
    return Promise.all(result);
  },
  totalSupply() {
    return this.buyContract.methods.totalSupply().call();
  },
  getDownList(id) {
    return this.buyContract.methods.getDownList(id).call();
  },
  upMap(id) {
    return this.buyContract.methods.upMap(id).call();
  },
  async enabled() {
    await this.buyContract.methods.enabled().call();
  },
  getNextId(){
    return this.buyContract.methods.getNextId(0).call();
  },
  async transferFromNFT(toAddress, nftTokenId, fn){
    let result ={ error: -1, data: null };
    if(this.nftContract){
      try {
        result.data = await this.nftContract.methods.transferFrom(this.userWalletAddress, toAddress, nftTokenId).send({ from: this.userWalletAddress });
        result.error = 0
        return fn && fn(result);
      } catch (e) {
        result.data = e.message;
        return fn && fn(result);
      }
    } else {
      return fn && fn(result);
    }
  },
  async getNftDepositList(fn){
    let result ={ error: -1, data: 'Contract is error' };
    if(this.nftContract){
      try {
        result.data = [];
        let nftCount = await this.nftContract.methods.balanceOf(this.userWalletAddress).call();
        if(nftCount && nftCount.indexOf('Error') === -1){
          if(nftCount > 0){
            let nftToken = null;
            let nftUri = null;
            for(let i=0;i<nftCount;i++){
              nftToken = await this.nftContract.methods.tokenOfOwnerByIndex(this.userWalletAddress, i).call();
              if(nftToken && nftToken.indexOf('Error') === -1){
                nftUri = await this.nftContract.methods.tokenURI(nftToken).call();
                if(nftUri && nftUri.indexOf('Error') === -1){
                  let item = {
                    tokenId: nftToken,
                    url: nftUri,
                  }
                  result.data.push(item);
                }
              }
            }
          }
          result.error = 0;
        } else{
          result.error = -1;
          result.data = 'Get NFTs failed';
        }
        return fn && fn(result);
      } catch (e) {
        result.data = e.message;
        return fn && fn(result);
      }
    }
    return fn && fn(result);
  },
};
