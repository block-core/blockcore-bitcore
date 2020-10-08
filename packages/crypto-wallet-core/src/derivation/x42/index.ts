const BitcoreLib = require('bitcore-lib-x42');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class X42Deriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      