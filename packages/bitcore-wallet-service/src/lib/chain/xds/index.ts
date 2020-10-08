import { BitcoreLibXds } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class XdsChain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLibXds);
        }
      }
      