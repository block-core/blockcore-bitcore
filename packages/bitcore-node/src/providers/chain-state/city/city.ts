import { InternalStateProvider } from '../internal/internal';

export class CITYStateProvider extends InternalStateProvider {
  constructor(chain: string = 'CITY') {
    super(chain);
    console.log('CHAIN STATE CITY!!');
  }
}
