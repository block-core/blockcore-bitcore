import { BchValidation } from './bch';
import { BtcValidation } from './btc';
      import { CityValidation } from './city';
      import { ExosValidation } from './exos';
      import { RutaValidation } from './ruta';
      import { XlrValidation } from './xlr';
      import { StratValidation } from './strat';
      import { X42Validation } from './x42';
      import { XdsValidation } from './xds';
import { EthValidation } from './eth';
import { XrpValidation } from './xrp';

export interface IValidation {
  validateAddress(network: string, address: string): boolean;
  validateUri(addressUri: string): boolean;
}

const validation: { [chain: string]: IValidation } = {
  BTC: new BtcValidation(),
  BCH: new BchValidation(),
  ETH: new EthValidation(),
  XRP: new XrpValidation(),
  CITY: new CityValidation(),
  EXOS: new ExosValidation(),
  RUTA: new RutaValidation(),
  XLR: new XlrValidation(),
  STRAT: new StratValidation(),
  X42: new X42Validation(),
  XDS: new XdsValidation(),
};

export class ValidationProxy {
  get(chain) {
    const normalizedChain = chain.toUpperCase();
    return validation[normalizedChain];
  }

  validateAddress(chain, network, address) {
    return this.get(chain).validateAddress(network, address);
  }

  validateUri(chain, addressUri) {
    return this.get(chain).validateUri(addressUri);
  }
}

export default new ValidationProxy();
