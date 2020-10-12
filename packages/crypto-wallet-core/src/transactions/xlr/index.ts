import { BTCTxProvider } from '../btc';

      export class XlrTxProvider extends BTCTxProvider {
        lib = require('@blockcore/bitcore-lib-city');
      }
      