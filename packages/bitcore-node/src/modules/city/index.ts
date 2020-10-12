import { BaseModule } from '..';
import { BTCStateProvider } from '../../providers/chain-state/btc/btc';
import { BitcoinP2PWorker } from '../bitcoin/p2p';
import { VerificationPeer } from '../bitcoin/VerificationPeer';

export default class CityModule extends BaseModule {
  constructor(services: BaseModule['bitcoreServices']) {
    super(services);
    services.Libs.register('CITY', '@blockcore/bitcore-lib-city', 'bitcore-p2p');
    services.P2P.register('CITY', BitcoinP2PWorker);
    services.CSP.registerService('CITY', new BTCStateProvider('CITY'));
    services.Verification.register('CITY', VerificationPeer);
  }
}
