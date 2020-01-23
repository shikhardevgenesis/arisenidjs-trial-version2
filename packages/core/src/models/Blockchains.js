
export const Blockchains = {
    ARISEN:'arisen',
    ETH:'eth',
    TRX:'trx'
};

export const BlockchainsArray =
    Object.keys(Blockchains).map(key => ({key, value:Blockchains[key]}));