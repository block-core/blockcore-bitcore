import { BaseModule } from '..';
import { CITYStateProvider } from '../../providers/chain-state/city/city';
import { BitcoinP2PWorker } from '../bitcoin/p2p';
import { VerificationPeer } from '../bitcoin/VerificationPeer';

export default class CityModule extends BaseModule {
  constructor(services: BaseModule['bitcoreServices']) {
    super(services);
    services.Libs.register('CITY', 'bitcore-lib-city', 'bitcore-p2p-city');
    services.P2P.register('CITY', BitcoinP2PWorker);
    services.CSP.registerService('CITY', new CITYStateProvider('CITY'));
    services.Verification.register('CITY', VerificationPeer);
  }
}
