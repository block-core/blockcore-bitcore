import { IValidation } from '..';
const Bitcore = require('@blockcore/bitcore-lib-city');

export class StratValidation implements IValidation {
  validateAddress(network: string, address: string): boolean {
    const Address = Bitcore.Address;
    // Regular Address: try Bitcoin
    return Address.isValid(address, network);
  }

  validateUri(addressUri: string): boolean {
    // Check if the input is a valid uri or address
    const URI = Bitcore.URI;
    // Bip21 uri
    return URI.isValid(addressUri);
  }
}
