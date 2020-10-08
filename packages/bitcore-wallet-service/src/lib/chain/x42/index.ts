import { BitcoreLibX42 } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class X42Chain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLibX42);
        }
      }
      