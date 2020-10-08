import { BTCTxProvider } from '../btc';

      export class StratTxProvider extends BTCTxProvider {
        lib = require('bitcore-lib-strat');
      }
      