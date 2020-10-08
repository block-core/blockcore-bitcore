import { BitcoreLibCity } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class CityChain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLibCity);
        }
      }
      