import { BCHTxProvider } from './bch';
import { BTCTxProvider } from './btc';
      import { CityTxProvider } from './city';
      import { ExosTxProvider } from './exos';
      import { RutaTxProvider } from './ruta';
      import { XlrTxProvider } from './xlr';
      import { StratTxProvider } from './strat';
      import { X42TxProvider } from './x42';
      import { XdsTxProvider } from './xds';
import { ERC20TxProvider } from './erc20';
import { ETHTxProvider } from './eth';
import { ETHMULTISIGTxProvider } from './eth-multisig';
import { XRPTxProvider } from './xrp';

const providers = {
  BTC: new BTCTxProvider(),
  BCH: new BCHTxProvider(),
  ETH: new ETHTxProvider(),
  ERC20: new ERC20TxProvider(),
  ETHMULTISIG: new ETHMULTISIGTxProvider(),
  XRP: new XRPTxProvider(),
  CITY: new CityTxProvider(),
  EXOS: new ExosTxProvider(),
  RUTA: new RutaTxProvider(),
  XLR: new XlrTxProvider(),
  STRAT: new StratTxProvider(),
  X42: new X42TxProvider(),
  XDS: new XdsTxProvider(),
};

export class TransactionsProxy {
  get({ chain }) {
    return providers[chain];
  }

  create(params) {
    return this.get(params).create(params);
  }

  sign(params): string {
    return this.get(params).sign(params);
  }

  getSignature(params): string {
    return this.get(params).getSignature(params);
  }

  applySignature(params) {
    return this.get(params).applySignature(params);
  }

  getHash(params) {
    return this.get(params).getHash(params);
  }
}

export default new TransactionsProxy();
