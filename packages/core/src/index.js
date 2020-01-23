import PluginRepository from './plugins/PluginRepository';
import SocketService from './services/SocketService';
import Plugin from './plugins/Plugin';
import * as PluginTypes from './plugins/PluginTypes';
import { Blockchains } from './models/Blockchains';
import Network from './models/Network';
import WalletInterface, {WALLET_METHODS} from './models/WalletInterface';
import LocalSocket from "./wallets/LocalSocket";
import RelaySocket from "./wallets/RelaySocket";
import LegacyInjection from "./wallets/LegacyInjection";
import Injection from "./wallets/Injection";
import Token from "./models/Token";

let origin;

const EVENTS = {
	Disconnected:'dced',
	LoggedOut:'logout',
};

let socket = null;
let socketSetters = [];
let holderFns = {};
class Index {

	constructor(){
		this.identity = null;
		this.network = null;

		PluginRepository.loadPlugin(new RelaySocket(this, holderFns));
		PluginRepository.loadPlugin(new LocalSocket(this, holderFns));
		PluginRepository.loadPlugin(new Injection(this, holderFns));
		PluginRepository.loadPlugin(new LegacyInjection(this, holderFns));
	}

	loadPlugin(plugin){
		const noIdFunc = () => { if(!holderFns.get().identity) throw new Error('No Identity') };
		if(!plugin.isValid()) throw new Error(`${plugin.name} doesn't seem to be a valid ArisenidJS plugin.`);

		PluginRepository.loadPlugin(plugin);

		if(plugin.type === PluginTypes.BLOCKCHAIN_SUPPORT){
			this[plugin.name] = plugin.signatureProvider(noIdFunc, () => holderFns.get().identity);
			this[plugin.name+'Hook'] = plugin.hookProvider;
			if(typeof plugin.multiHook === 'function') this[plugin.name+'MultiHook'] = plugin.multiHook;
			socketSetters.push(plugin.setSocketService);
		}

		if(plugin.type === PluginTypes.WALLET_SUPPORT){
			plugin.init(this, holderFns, socketSetters);
		}
	}

	async connect(pluginName, options){
		return new Promise(async resolve => {
			if(!options) options = {};
			this.network = options.hasOwnProperty('network') ? options.network : null;

			const wallets = PluginRepository.wallets();

			if(socket) {
				socket.disconnect();
				socket = null;
			}

			let connected = false;
			let promises = [];
			for(let i = 0; i < wallets.length; i++){
				if(connected) return;
				const wallet = wallets[i];
				promises.push(Promise.race([
					wallet.connect(pluginName, options).then(async socketService => {
						if(socketService) {
							if(socketService !== 'injection') {
								socket = socketService;
								socketSetters.map(x => x(socketService));
							}
							if(typeof wallet.runBeforeInterfacing === 'function') await wallet.runBeforeInterfacing();
							new WalletInterface(wallet.name, wallet.methods(), holderFns.get());
							if(typeof wallet.runAfterInterfacing === 'function') await wallet.runAfterInterfacing();
							WalletInterface.bindBasics(holderFns.get());
							connected = true;
							resolve(true);
						}
					}).catch(() => false),
					new Promise(r => setTimeout(() => r(false), 5000))
				]))
			}

			await Promise.all(promises);
			resolve(false);
		})
	}
}


class Holder {
    constructor(_arisenid){
        this.arisenid = _arisenid;
    }

	plugins(...plugins) {
		if (!this.arisenid.isExtension) {
			plugins.map(plugin => this.arisenid.loadPlugin(plugin));
		}
	}

	connect(...params){
    	return this.arisenid.connect(...params);
	}

	catchAll(...params){

	}
}


let holder = new Proxy(new Holder(new Index()), {
	get(target,name) {
		if(typeof target[name] !== 'undefined') return target[name];
		return target.arisenid[name];
	}
});
holderFns.set = s => holder.arisenid = s;
holderFns.get = () => holder.arisenid;
if(typeof window !== 'undefined') window.ArisenidJS = holder;


holder.Plugin = Plugin;
holder.PluginTypes = PluginTypes;
holder.Blockchains = Blockchains;
holder.Network = Network;
holder.Token = Token;
holder.SocketService = SocketService;
holder.EVENTS = EVENTS;
holder.WalletInterface = WalletInterface;
holder.WALLET_METHODS = WALLET_METHODS;
export {Plugin, PluginTypes, Blockchains, Network, SocketService, EVENTS, WalletInterface, WALLET_METHODS};
export default holder;


