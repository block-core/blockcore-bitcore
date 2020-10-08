import { BaseModule } from '..';
import { BTCStateProvider } from '../../providers/chain-state/btc/btc';
import { BitcoinP2PWorker } from '../bitcoin/p2p';
import { VerificationPeer } from '../bitcoin/VerificationPeer';

export default class X42Module extends BaseModule {
  constructor(services: BaseModule['bitcoreServices']) {
    super(services);
    services.Libs.register('X42', 'bitcore-lib-x42', 'bitcore-p2p');
    services.P2P.register('X42', BitcoinP2PWorker);
    services.CSP.registerService('X42', new BTCStateProvider('X42'));
    services.Verification.register('X42', VerificationPeer);
  }
}
