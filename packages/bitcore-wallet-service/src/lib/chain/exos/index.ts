import { BitcoreLibExos } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class ExosChain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLibExos);
        }
      }
      