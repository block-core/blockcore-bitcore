module.exports = {
  BTC: {
    lib: require('bitcore-lib'),
    p2p: require('bitcore-p2p')
  },
  BCH: {
    lib: require('bitcore-lib-cash'),
    p2p: require('bitcore-p2p-cash')
  },
  CITY: {
    lib: require('bitcore-lib-city'),
    p2p: require('bitcore-p2p')
  }
};
