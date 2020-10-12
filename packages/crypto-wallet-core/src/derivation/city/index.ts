const BitcoreLib = require('@blockcore/bitcore-lib-city');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class CityDeriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      