import { BTCTxProvider } from '../btc';

      export class CityTxProvider extends BTCTxProvider {
        lib = require('@blockcore/bitcore-lib-city');
      }
      