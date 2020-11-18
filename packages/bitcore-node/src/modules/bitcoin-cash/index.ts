import { BaseModule } from '..';
import { BCHStateProvider } from '../../providers/chain-state/bch/bch';
import { BitcoinP2PWorker } from '../city/p2p';
import { VerificationPeer } from '../city/VerificationPeer';

export default class BCHModule extends BaseModule {
  constructor(services) {
    super(services);
    services.Libs.register('BCH', 'bitcore-lib-cash', 'bitcore-p2p-cash');
    services.P2P.register('BCH', BitcoinP2PWorker);
    services.CSP.registerService('BCH', new BCHStateProvider());
    services.Verification.register('BCH', VerificationPeer);
  }
}
