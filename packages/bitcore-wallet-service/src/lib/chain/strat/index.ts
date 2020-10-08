import { BitcoreLibStrat } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class StratChain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLibStrat);
        }
      }
      