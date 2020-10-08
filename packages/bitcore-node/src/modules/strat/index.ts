import { BaseModule } from '..';
import { BTCStateProvider } from '../../providers/chain-state/btc/btc';
import { BitcoinP2PWorker } from '../bitcoin/p2p';
import { VerificationPeer } from '../bitcoin/VerificationPeer';

export default class StratModule extends BaseModule {
  constructor(services: BaseModule['bitcoreServices']) {
    super(services);
    services.Libs.register('STRAT', 'bitcore-lib-strat', 'bitcore-p2p');
    services.P2P.register('STRAT', BitcoinP2PWorker);
    services.CSP.registerService('STRAT', new BTCStateProvider('STRAT'));
    services.Verification.register('STRAT', VerificationPeer);
  }
}
