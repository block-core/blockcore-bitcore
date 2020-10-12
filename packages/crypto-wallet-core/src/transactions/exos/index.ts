import { BTCTxProvider } from '../btc';

      export class ExosTxProvider extends BTCTxProvider {
        lib = require('@blockcore/bitcore-lib-city');
      }
      