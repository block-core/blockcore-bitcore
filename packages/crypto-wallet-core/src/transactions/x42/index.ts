import { BTCTxProvider } from '../btc';

      export class X42TxProvider extends BTCTxProvider {
        lib = require('@blockcore/bitcore-lib-city');
      }
      