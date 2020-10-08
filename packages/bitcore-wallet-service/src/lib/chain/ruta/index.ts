import { BitcoreLibRuta } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class RutaChain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLibRuta);
        }
      }
      