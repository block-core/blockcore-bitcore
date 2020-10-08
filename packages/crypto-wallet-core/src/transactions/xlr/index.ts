import { BTCTxProvider } from '../btc';

      export class XlrTxProvider extends BTCTxProvider {
        lib = require('bitcore-lib-xlr');
      }
      