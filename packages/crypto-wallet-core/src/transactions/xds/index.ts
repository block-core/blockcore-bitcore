import { BTCTxProvider } from '../btc';

      export class XdsTxProvider extends BTCTxProvider {
        lib = require('@blockcore/bitcore-lib-city');
      }
      