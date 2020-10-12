import { BTCTxProvider } from '../btc';

      export class RutaTxProvider extends BTCTxProvider {
        lib = require('@blockcore/bitcore-lib-city');
      }
      