import $web3Ext from './web3/web3.extend';

/** connect wallet **/
$web3Ext.init('connectWallet', null, async (res) => {
    if (res.err === 0) {
        /** add a currency to your wallet **/
        let currency = {
            contract: 'this is the currency contract address',
            decimals: 'this is the contract decimals',
            symbol: 'this is the currency symbol',
            image: 'this is the currency icon',
        }
        await $web3Ext.addWalletAsset(currency);
    } else {
        if (res.data) {
            // this is an error by wallet connect
        } else {
            // this is an error for unknown
        }
    }
});

/** buy a node **/
$web3Ext.init('buyNodes', 'user wallet address', async (res) => {
    /** User refuses to switch networks **/
    if(res.err === -1){
        // show err res.data
    }
    /** Wallet address bound, inconsistent **/
    if(res.err === -2){
        // show err res.data
    }
    /** Bound, Connected **/
    if(res.err === 0){
        // to do your code
    }
    /** Unbound, connected **/
    if(res.err === 1){
        // show err res.data
    }
});

/** get web3 contract sig **/
const sig = await $web3Ext.getSignature('user blockchain token, by backend', 'user wallet address');
console.log('sig', sig);
