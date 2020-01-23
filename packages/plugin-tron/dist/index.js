"use strict";var _interopRequireDefault=require("../../plugin-arisenjs2/dist/node_modules/@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:!0}),exports["default"]=void 0;var _classCallCheck2=_interopRequireDefault(require("../../plugin-arisenjs2/dist/node_modules/@babel/runtime/helpers/classCallCheck")),_createClass2=_interopRequireDefault(require("../../plugin-arisenjs2/dist/node_modules/@babel/runtime/helpers/createClass")),_possibleConstructorReturn2=_interopRequireDefault(require("../../plugin-arisenjs2/dist/node_modules/@babel/runtime/helpers/possibleConstructorReturn")),_getPrototypeOf2=_interopRequireDefault(require("../../plugin-arisenjs2/dist/node_modules/@babel/runtime/helpers/getPrototypeOf")),_inherits2=_interopRequireDefault(require("../../plugin-arisenjs2/dist/node_modules/@babel/runtime/helpers/inherits")),_core=require("../../plugin-arisenjs2/dist/node_modules/@arisenidjs/core"),socketService=_core.SocketService,proxy=function(a,b){return new Proxy(a,b)},ArisenidTron=/*#__PURE__*/function(a){function b(){return(0,_classCallCheck2["default"])(this,b),(0,_possibleConstructorReturn2["default"])(this,(0,_getPrototypeOf2["default"])(b).call(this,_core.Blockchains.TRX,_core.PluginTypes.BLOCKCHAIN_SUPPORT))}return(0,_inherits2["default"])(b,a),(0,_createClass2["default"])(b,[{key:"setSocketService",value:function setSocketService(a){socketService=a}},{key:"hookProvider",value:function hookProvider(){throw new Error("Tron hook provider not enabled yet.")}},{key:"signatureProvider",value:function signatureProvider(){var a=0>=arguments.length?void 0:arguments[0],b=1>=arguments.length?void 0:arguments[1];return function(c,d){c=_core.Network.fromJson(c);var e=function(){var b=0<arguments.length&&void 0!==arguments[0]?arguments[0]:null;return function(e){return a(),new Promise(function(a,f){var g={transaction:e,participants:[d.defaultAddress.base58]},h={transaction:g,blockchain:_core.Blockchains.TRX,network:c,requiredFields:{},abi:b};socketService.sendApiRequest({type:"requestSignature",payload:h}).then(function(b){return a(b.signatures[0])})["catch"](function(a){return f(a)})})}},f=function(){var a=b(),c=a&&a.accounts.find(function(a){return a.blockchain===_core.Blockchains.TRX})?a.accounts.find(function(a){return a.blockchain===_core.Blockchains.TRX}).address:null;c&&d.setAddress(c)};return proxy(d,{get:function get(c,g){return f(),d.trx.sign=e(),"function"==typeof c[g]?function(){for(var a=arguments.length,d=Array(a),h=0;h<a;h++)d[h]=arguments[h];return"contract"===g?proxy(c[g].apply(c,d),{get:function get(g,a){return f(),c.trx.sign=e({abi:d[0],address:d[1],method:a}),g[a]}}):c[g].apply(c,d)}:c[g]}})}}}]),b}(_core.Plugin);exports["default"]=ArisenidTron,"undefined"!=typeof window&&(window.ArisenidTron=ArisenidTron);