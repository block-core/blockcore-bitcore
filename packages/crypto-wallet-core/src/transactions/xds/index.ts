import { BTCTxProvider } from '../btc';

      export class XdsTxProvider extends BTCTxProvider {
        lib = require('bitcore-lib-xds');
      }
      