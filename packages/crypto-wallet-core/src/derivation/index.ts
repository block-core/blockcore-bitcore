import { BchDeriver } from './bch';
import { BtcDeriver } from './btc';
import { CityDeriver } from './city';
import { ExosDeriver } from './exos';
import { RutaDeriver } from './ruta';
import { XlrDeriver } from './xlr';
import { StratDeriver } from './strat';
import { X42Deriver } from './x42';
import { XdsDeriver } from './xds';
import { EthDeriver } from './eth';
import { Paths } from './paths';
import { XrpDeriver } from './xrp';

export interface Key {
  address: string;
  privKey?: string;
  pubKey?: string;
}

export interface IDeriver {
  deriveAddress(network: string, xPub: string, addressIndex: number, isChange: boolean): string;

  derivePrivateKey(network: string, xPriv: string, addressIndex: number, isChange: boolean): Key;
}

const derivers: { [chain: string]: IDeriver } = {
  BTC: new BtcDeriver(),
  BCH: new BchDeriver(),
  ETH: new EthDeriver(),
  XRP: new XrpDeriver(),
  CITY: new CityDeriver(),
  EXOS: new ExosDeriver(),
  RUTA: new RutaDeriver(),
  XLR: new XlrDeriver(),
  STRAT: new StratDeriver(),
  X42: new X42Deriver(),
  XDS: new XdsDeriver(),
};

export class DeriverProxy {
  get(chain) {
    return derivers[chain];
  }

  deriveAddress(chain, network, xpubKey, addressIndex, isChange) {
    return this.get(chain).deriveAddress(network, xpubKey, addressIndex, isChange);
  }

  derivePrivateKey(chain, network, privKey, addressIndex, isChange) {
    return this.get(chain).derivePrivateKey(network, privKey, addressIndex, isChange);
  }

  pathFor(chain, network, account = 0) {
    const normalizedChain = chain.toUpperCase();
    const accountStr = `${account}'`;
    const chainConfig = Paths[normalizedChain];
    if (chainConfig && chainConfig[network]) {
      return chainConfig[network] + accountStr;
    } else {
      return Paths.default.testnet + accountStr;
    }
  }
}

export default new DeriverProxy();
