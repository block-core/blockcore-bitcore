import { BaseModule } from '..';
import { BTCStateProvider } from '../../providers/chain-state/btc/btc';
import { BitcoinP2PWorker } from '../bitcoin/p2p';
import { VerificationPeer } from '../bitcoin/VerificationPeer';

export default class XdsModule extends BaseModule {
  constructor(services: BaseModule['bitcoreServices']) {
    super(services);
    services.Libs.register('XDS', 'bitcore-lib-xds', 'bitcore-p2p');
    services.P2P.register('XDS', BitcoinP2PWorker);
    services.CSP.registerService('XDS', new BTCStateProvider('XDS'));
    services.Verification.register('XDS', VerificationPeer);
  }
}
