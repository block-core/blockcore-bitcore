import { BTCTxProvider } from '../btc';

      export class ExosTxProvider extends BTCTxProvider {
        lib = require('bitcore-lib-exos');
      }
      