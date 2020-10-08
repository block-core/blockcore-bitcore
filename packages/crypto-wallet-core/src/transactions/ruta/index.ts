import { BTCTxProvider } from '../btc';

      export class RutaTxProvider extends BTCTxProvider {
        lib = require('bitcore-lib-ruta');
      }
      