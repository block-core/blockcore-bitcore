const BitcoreLib = require('bitcore-lib-xlr');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class XlrDeriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      