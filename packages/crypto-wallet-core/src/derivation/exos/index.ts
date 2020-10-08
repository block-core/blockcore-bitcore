const BitcoreLib = require('bitcore-lib-exos');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class ExosDeriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      