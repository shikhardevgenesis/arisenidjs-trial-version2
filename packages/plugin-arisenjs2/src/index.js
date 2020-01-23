import {
	Plugin,
	PluginTypes,
	Blockchains,
	Network,
	SocketService
} from '@arisenidjs/core';

let socketService = SocketService;
const proxy = (dummy, handler) => new Proxy(dummy, handler);
let cache = {};

export default class ArisenidARISEN extends Plugin {

    constructor(){
        super(Blockchains.ARISEN, PluginTypes.BLOCKCHAIN_SUPPORT);
    }

	setSocketService(_s){
		socketService = _s;
	}

    hookProvider(network, fieldsFetcher = null){
        network = Network.fromJson(network);

        return {
            requiredFields:{},
            getAvailableKeys:async () => {
                return await socketService.sendApiRequest({
                    type:'identityFromPermissions',
                    payload:{}
                }).then(id => {
                    if(!id) return [];
                    return id.accounts.filter(x => x.blockchain === Blockchains.ARISEN).map(x => x.publicKey)
                });
            },

            sign:async (signargs) => {
                const requiredFields = fieldsFetcher ? fieldsFetcher() : {};
                signargs.serializedTransaction = Buffer.from(signargs.serializedTransaction).toString('hex');

                return new Promise(async (resolve, reject) => {
	                socketService.sendApiRequest({
                        type:'requestSignature',
                        payload:{ transaction:signargs, blockchain:Blockchains.ARISEN, network, requiredFields }
                    }).then(x => {
	                    resolve({signatures:x.signatures, serializedTransaction:Buffer.from(signargs.serializedTransaction, 'hex')})
                    })
                      .catch(x => reject(x))
                })
            }
        }
    }

    multiHook(network, signers){
        const arisenidSigner = this.arisenHook(network);

        if(!Array.isArray(signers)) signers = [signers];

        return {
            getAvailableKeys:async () => {
	            try {
		            const arisenidKeys = await arisenidSigner.getAvailableKeys();

		            let otherKeys = [];
		            await Promise.all(signers.map(async signer => {
			            await signer.getAvailableKeys().then(keys => {
				            keys.map(key => otherKeys.push(key));
			            });
		            	return true;
		            }));

		            return arisenidKeys.concat(otherKeys)
	            } catch(e){
		            throw new Error(e);
	            }
            },

            sign:async (signargs) => {
	            try {
		            const serializedTransaction = Buffer.from(signargs.serializedTransaction, 'hex');

		            const individualSignArgs = async provider => ({
			            abis:signargs.abis,
			            chainId: network.chainId,
			            requiredKeys: await provider.getAvailableKeys(),
			            serializedTransaction
		            });

		            const pullOutSignatures = result => {
			            if(typeof result === 'object' && result.hasOwnProperty('signatures')) return result.signatures;
			            return result;
		            };

		            const arisenidSigs = await arisenidSigner
			            .sign(await individualSignArgs(arisenidSigner))
			            .then(x => pullOutSignatures(x));

		            let otherSigs = [];
		            await Promise.all(signers.map(async signer => {
			            await signer.sign(await individualSignArgs(signer)).then(result => {
				            pullOutSignatures(result).map(sig => otherSigs.push(sig));
			            });
			            return true;
		            }));

		            return {
			            signatures: arisenidSigs.concat(otherSigs),
			            serializedTransaction
		            }
	            } catch(e){
	            	throw new Error(e);
	            }
            }
        }
    }

    signatureProvider(...args){

        const throwIfNoIdentity = args[0];

        // Protocol will be deprecated.
        return (network, _api, _options = {}) => {

            network = Network.fromJson(network);

            let requiredFields = {};
            const fieldsFetcher = () => requiredFields;
            const signatureProvider = this.hookProvider(network, fieldsFetcher);

            // The proxy stands between the arisenjs object and arisenid.
            // This is used to add special functionality like adding `requiredFields` arrays to transactions
            return proxy(new _api(Object.assign(_options, {signatureProvider})), {
                get(arisenInstance, method) {

                    return (...args) => {
                    	if(typeof arisenInstance[method] === 'undefined'){
                    		throw new Error(`${method} does not exist on the arisenjs.Api() object.`)
						}

                        const rqf = args.find(arg => arg.hasOwnProperty('requiredFields'));
                        requiredFields = rqf ? rqf.requiredFields : {};
                        return arisenInstance[method](...args)
                    }
                }
            }); // Proxy

        }
    }
}

if(typeof window !== 'undefined') {
	window.ArisenidARISEN = ArisenidARISEN;
}
