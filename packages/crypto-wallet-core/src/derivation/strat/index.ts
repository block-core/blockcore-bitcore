const BitcoreLib = require('@blockcore/bitcore-lib-city');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class StratDeriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      