const BitcoreLib = require('bitcore-lib-xds');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class XdsDeriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      