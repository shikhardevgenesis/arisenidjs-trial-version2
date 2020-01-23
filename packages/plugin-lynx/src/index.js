import {Blockchains, Network, Plugin, PluginTypes, SocketService, WALLET_METHODS} from '../../plugin-arisenjs2/dist/node_modules/@arisenidjs/core';

let network;

let isAvailable = false;
if(typeof window !== 'undefined') {
	if(typeof window.lynxMobile !== 'undefined') isAvailable = true;
	else window.addEventListener('lynxMobileLoaded', () => isAvailable = true);
}

const pollExistence = async (resolver = null, tries = 0) => {
	return new Promise(r => {
		if(!resolver) resolver = r;
		if(isAvailable) return resolver(true);
		if(tries > 5) return resolver(false);
		setTimeout(() => pollExistence(resolver, tries + 1), 100);
	})
};


const hashHex = buffer => {
	let digest = '';
	let view = new DataView(buffer);
	for(let i = 0; i < view.byteLength; i += 4) {
		const PADDING = '00000000';
		digest += (PADDING + view.getUint32(i).toString(16)).slice(-PADDING.length)
	}

	return digest;
};

const sha256 = async data => {
	const buffer = new TextEncoder("utf-8").encode(data);
	return hashHex(await crypto.subtle.digest('SHA-256', buffer));
}


export default class ArisenidLynx extends Plugin {

    constructor(arisenjs){
	    super(Blockchains.ARISEN, PluginTypes.WALLET_SUPPORT);

    	if(!arisenjs) {
    		console.error('Lynx Plugin: You must pass in an arisenjs version. Either ({Api, JsonRpc}) for arisenjs2 or (Arisen) for arisenjs1');
    		return;
	    }
	    this.name = 'Lynx';
	    this.isArisenjs2 = false;

	    // arisenjs2
	    if(arisenjs.hasOwnProperty('JsonRpc')){
	    	this.arisenjs = arisenjs;
		    this.isArisenjs2 = true;
	    }
	    else {
	    	if(typeof arisenjs !== 'function') throw new Error('Lynx Plugin: Invalid arisenjs. Please use 16.0.9 or 20+');
		    this.arisenjs = arisenjs;
	    }
    }

    init(context, holderFns, socketSetters){
	    this.context = context;
	    this.holderFns = holderFns;
	    this.socketSetters = socketSetters;
    }

	async connect(pluginName){
    	this.plugin = pluginName;
		return new Promise(async resolve => {
			const found = await pollExistence();
			if(found) {
				if(!this.holderFns.get().wallet) this.holderFns.get().wallet = this.name;
				resolve(true);
			}
		})
	}

	async runAfterInterfacing(){
		this.methods()[WALLET_METHODS.getIdentity]();
		const selfSocket = { sendApiRequest:x => this.methods()[x.type](x.payload) };
		this.socketSetters.map(x => x(selfSocket));
		return true;
	}

    methods(){
        return {
	        [WALLET_METHODS.isConnected]:async () => true,
	        [WALLET_METHODS.disconnect]:async () => true,
	        [WALLET_METHODS.isPaired]:async () => true,

	        [WALLET_METHODS.getIdentity]:async (requiredFields) => {
		        let identity;

		        if(!requiredFields) requiredFields = {};

		        const requestedChainId = requiredFields.hasOwnProperty('accounts') && requiredFields.accounts.length
			        ? requiredFields.accounts[0].chainId
		            : 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';

		        const accountState = await window.lynxMobile.requestSetAccount();
		        if (!accountState) return null;
		        const perm = accountState.account.permissions.find(x => x.perm_name === 'active');
		        const publicKey = perm.required_auth.keys[0].key;
		        const chainId = accountState.chainId || requestedChainId;

		        if(chainId !== requestedChainId){
			        throw new Error(`User does not have an account with the chainId "${requestedChainId}" selected in Lynx.`);
		        }

		        const accounts = [{
			        name: accountState.account.account_name,
			        authority: perm.perm_name,
			        publicKey,
			        blockchain: Blockchains.ARISEN,
			        isHardware: false,
			        chainId
		        }];

		        identity = {
			        name: accounts[0].name,
			        accounts,
			        publicKey
		        };

		        this.context.identity = identity;
		        return identity;
	        },
	        [WALLET_METHODS.forgetIdentity]:async () => {
		        this.context.identity = null;
		        return true;
	        },
	        ['identityFromPermissions']:async () => this.context.identity,
	        [WALLET_METHODS.getIdentityFromPermissions]:async () => this.context.identity,

	        [WALLET_METHODS.getArbitrarySignature]:(publicKey, data) => {
		        const origin = SocketService.getOriginOrPlugin(this.plugin);
		        return window.lynxMobile.requestArbitrarySignature({data, whatFor:`${origin} is requesting an arbitrary signature`});
	        },
	        [WALLET_METHODS.authenticate]:async (nonce, data = null, publicKey = null) => {
		        const origin = SocketService.getOriginOrPlugin(this.plugin);
		        data = data ? data : origin;
		        const toSign = await sha256(await sha256(data)+await sha256(nonce))
		        return window.lynxMobile.requestArbitrarySignature({data:toSign, whatFor:`${origin} wants to authenticate your public key`});
	        },

	        [WALLET_METHODS.requestSignature]:async ({abis, transaction, network}) => {
		        let parsed;

		        if(this.isArisenjs2){
			        const rpc = new this.arisenjs.JsonRpc(Network.fromJson(network).fullhost());
			        const OPTIONS = {rpc};
			        Object.keys(this.arisenjs).map(key => {
			        	if(key === 'JsonRpc' || key === 'Api') return;
			        	OPTIONS[key] = this.arisenjs[key];
			        });
			        const api = new this.arisenjs.Api(OPTIONS);

			        transaction.abis.map(({account_name, abi:rawAbi}) => api.cachedAbis.set(account_name, { rawAbi, abi:api.rawAbiToJson(rawAbi) }));
			        parsed = await api.deserializeTransactionWithActions(transaction.serializedTransaction);
		        }
		        else {
		        	const arisen = new this.arisenjs({httpEndpoint:Network.fromJson(network).fullhost(), chainId:network.chainId});
		        	let abis = {};
			        const contracts = transaction.actions.map(action => action.account).reduce((acc,x) => {
			        	if(!acc.includes(x)) acc.push(x);
			        	return acc;
			        }, []);
			        await Promise.all(contracts.map(async contractAccount => {
				        abis[contractAccount] = (await arisen.contract(contractAccount)).fc;
			        }));

			        parsed = {actions:await Promise.all(transaction.actions.map(async (action, index) => {
				        const contractAccountName = action.account;
				        let abi = abis[contractAccountName];

				        const typeName = abi.abi.actions.find(x => x.name === action.name).type;
				        const data = abi.fromBuffer(typeName, action.data);
				        const actionAbi = abi.abi.actions.find(fcAction => fcAction.name === action.name);
				        arisen.fc.abiCache.abi(contractAccountName, abi.abi);

				        return {
					        data,
					        account:action.account,
					        name:action.name,
					        authorization:action.authorization,
				        };
			        }))};

			        const clone = Object.assign({}, transaction);
			        delete clone.actions;
			        parsed = Object.assign(parsed, clone);

		        }

		        return window.lynxMobile.requestSignature(parsed);
	        },

	        [WALLET_METHODS.requestTransfer]:(network, to, amount, options = {}) => {
	        	let {contract, symbol, memo, decimals} = options;
	        	if(!contract) contract = 'arisenio.token';
	        	if(!symbol) symbol = 'ARISEN';

		        return window.lynxMobile.transfer({ contract, symbol, toAccount:to, amount, memo });
	        },
        }
    }


}

if(typeof window !== 'undefined') {
	window.ArisenidLynx = ArisenidLynx;
}
