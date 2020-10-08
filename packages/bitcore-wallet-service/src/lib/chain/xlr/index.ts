import { BitcoreLibXlr } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class XlrChain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLibXlr);
        }
      }
      