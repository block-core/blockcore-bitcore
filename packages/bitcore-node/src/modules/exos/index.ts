import { BaseModule } from '..';
import { BTCStateProvider } from '../../providers/chain-state/btc/btc';
import { BitcoinP2PWorker } from '../bitcoin/p2p';
import { VerificationPeer } from '../bitcoin/VerificationPeer';

export default class ExosModule extends BaseModule {
  constructor(services: BaseModule['bitcoreServices']) {
    super(services);
    services.Libs.register('EXOS', 'bitcore-lib-exos', 'bitcore-p2p');
    services.P2P.register('EXOS', BitcoinP2PWorker);
    services.CSP.registerService('EXOS', new BTCStateProvider('EXOS'));
    services.Verification.register('EXOS', VerificationPeer);
  }
}
