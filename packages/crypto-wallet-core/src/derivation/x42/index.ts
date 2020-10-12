const BitcoreLib = require('@blockcore/bitcore-lib-city');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class X42Deriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      