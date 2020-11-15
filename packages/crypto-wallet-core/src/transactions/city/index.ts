import { BTCTxProvider } from '../btc';

      export class CityTxProvider extends BTCTxProvider {
        lib = require('bitcore-lib-city');
      }
      