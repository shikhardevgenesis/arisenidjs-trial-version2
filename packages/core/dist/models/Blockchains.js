"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.BlockchainsArray=exports.Blockchains=void 0;var Blockchains={ARISEN:"arisen",ETH:"eth",TRX:"trx"};exports.Blockchains=Blockchains;var BlockchainsArray=Object.keys(Blockchains).map(function(a){return{key:a,value:Blockchains[a]}});exports.BlockchainsArray=BlockchainsArray;