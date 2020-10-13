/*

   Blockcore Patch Script

   Use this script to patch the mono-repo and add support for Blockcore.
   This initial script will update code and add support for additional chains based on Blockchain, and when
   it has been run, finish by running "npm install".

   The secondary script "patch-release.js", will replace the "crypto-wallet-core" package.json file. This should be
   done before releasing that script.

   npm config set @blockcore:registry https://registry.npmjs.org/
   npm config set @sondreb:registry https://registry.npmjs.org/

   chromeheadless fix: https://justinribeiro.com/chronicle/2019/10/02/workaround-for-karma-and-chrome-headless-on-windows-subsystem-for-linux-ala-wsl/
   export CHROME_BIN=/mnt/c/Program\ Files\ \(x86\)/Google/Chrome/Application/chrome.exe
*/

var fs = require('fs').promises;
var fs2 = require('fs');
var path = require('path');

async function copyFile(source, destination) {
   // destination will be created or overwritten by default.
   await fs.copyFile(source, destination);
   console.log(source + ' was copied.');
}

async function replaceInFile(filename, structures) {
   let data = await fs.readFile(filename, 'utf8');

   for (var i = 0; i < structures.length; i++) {
      let key = structures[i].key;
      let val = structures[i].value;
      let skipvalidation = structures[i].skipvalidation;
      let multiple = structures[i].multiple;

      if (skipvalidation || data.indexOf(val) == -1) {
         if (multiple) {
            while (data.indexOf(key) > -1) {
               data = data.replace(key, val);
            }
         }
         else {
            data = data.replace(key, val);
         }

         console.log('Patched: ' + key);
      }
      else {
         console.log('Already patched: ' + key);
      }
   }

   await fs.writeFile(filename, data, 'utf8');
}

async function writeFile(filename, data) {
   await fs.writeFile(filename, data, 'utf8');
}

async function createFolder(folder) {
   if (!fs2.existsSync(folder)) {
      await fs.mkdir(folder, 0744);
   }
}

function copyFolderSync(from, to) {
   try {
      fs2.mkdirSync(to);
   } catch (e) { }

   fs2.readdirSync(from).forEach((element) => {
      const stat = fs2.lstatSync(path.join(from, element));

      // Skip node_modules
      if (element != 'node_modules') {
         if (stat.isFile()) {
            fs2.copyFileSync(path.join(from, element), path.join(to, element));
         } else if (stat.isSymbolicLink()) {
            fs2.symlinkSync(fs2.readlinkSync(path.join(from, element)), path.join(to, element));
         } else if (stat.isDirectory()) {
            copyFolderSync(path.join(from, element), path.join(to, element));
         }
      }

   });
}

(async () => {

   // var chainsAll = [{ name: 'city' }, { name: 'exos' }, { name: 'ruta' }, { name: 'strat' }, { name: 'x42' }, { name: 'xds' }, { name: 'xlr' }];
   var chainsAll = [{ name: 'city' }];
   var units = '';
   var defaults = '';

   for (var i = 0; i < chainsAll.length; i++) {
      let chain = chainsAll[i];
      let chainName = chain.name;

      let unit = `  ` + chainName + `: {
         toSatoshis: 100000000,
         full: {
           maxDecimals: 8,
           minDecimals: 8
         },
         short: {
           maxDecimals: 6,
           minDecimals: 2
         }
       },`;

      let def = `  ` + chainName + `: [
         {
           name: 'priority',
           nbBlocks: 2,
           defaultValue: 50000
         },
         {
           name: 'normal',
           nbBlocks: 3,
           defaultValue: 30000
         },
         {
           name: 'economy',
           nbBlocks: 6,
           defaultValue: 25000
         }
       ],`;

      units += unit;
      defaults += def;
   }

   var exports = chainsAll.map(item => { return 'BitcoreLib' + item.name.charAt(0).toUpperCase() + item.name.slice(1) + ',' });
   var imports = chainsAll.map(item => { return `import * as BitcoreLib` + item.name.charAt(0).toUpperCase() + item.name.slice(1) + ` from 'bitcore-lib-` + item.name + `';
   `});

   await replaceInFile('crypto-wallet-core/src/index.ts', [{
      key: "import * as BitcoreLibCash from 'bitcore-lib-cash';",
      value: `import * as BitcoreLibCash from 'bitcore-lib-cash';
      ` + imports.join(' ')
   }, {
      key: "BitcoreLibCash, ",
      value: `BitcoreLibCash, ` + exports.join(' ')
   }]);

   await replaceInFile('crypto-wallet-core/src/constants/units.ts', [{ key: 'btc: {', value: units + 'btc: {' }]);
   await replaceInFile('bitcore-wallet-service/src/lib/common/defaults.ts', [{ key: 'btc: [', value: defaults + 'btc: [' }, {
      key: 'xrp: 1000000000000,',
      value: `xrp: 1000000000000,
      city: 10000 * 1000, // 10k sat/b, // TODO: Update these!
      exos: 10000 * 1000, // 10k sat/b,
      ruta: 10000 * 1000, // 10k sat/b,
      xlr: 10000 * 1000, // 10k sat/b,
      strat: 10000 * 1000, // 10k sat/b,
      x42: 10000 * 1000, // 10k sat/b,
      xds: 10000 * 1000, // 10k sat/b`
   }, {
      key: 'xrp: 0,',
      value: `xrp: 0,
      city: 0,
      exos: 0,
      ruta: 0,
      xlr: 0,
      strat: 0,
      x42: 0,
      xds: 0`
   }, {
      key: 'xrp: 1 * 1e6 // 1 xrp',
      value: `xrp: 1 * 1e6, // 1 xrp
      city: 0.01,
      exos: 0.01,
      ruta: 0.01,
      xlr: 0.01,
      strat: 0.05,
      x42: 0,
      xds: 0.01`
   }]);


   await copyFile('bitcore-p2p-cash/lib/messages/commands/sendheaders.js', 'bitcore-p2p/lib/messages/commands/sendheaders.js');

   await replaceInFile('bitcore-p2p/lib/messages/commands/sendheaders.js', [{ key: 'bitcore-lib-cash', value: 'bitcore-lib', skipvalidation: true }]);

   await replaceInFile('bitcore-p2p/lib/messages/builder.js', [{
      key: "getaddr: 'GetAddr'", value: `getaddr: 'GetAddr',
      sendheaders: 'SendHeaders'` }]);

   await replaceInFile('bitcore-wallet-client/src/lib/api.ts', [{
      key: 'xrp: CWC.BitcoreLib',
      value: `xrp: CWC.BitcoreLib,
     city: CWC.BitcoreLib,
     exos: CWC.BitcoreLib,
     ruta: CWC.BitcoreLib,
     xlr: CWC.BitcoreLib,
     strat: CWC.BitcoreLib,
     x42: CWC.BitcoreLib,
     xds: CWC.BitcoreLib,`
   }, {
      key: "['bch', 'livenet', true]",
      value: `['bch', 'livenet', true],
           ['city', 'livenet'],
           ['exos', 'livenet'],
           ['ruta', 'livenet'],
           ['xlr', 'livenet'],
           ['strat', 'livenet'],
           ['x42', 'livenet'],
           ['xds', 'livenet'],
           ['city', 'livenet', true],
           ['exos', 'livenet', true],
           ['ruta', 'livenet', true],
           ['xlr', 'livenet', true],
           ['strat', 'livenet', true],
           ['x42', 'livenet', true],
           ['xds', 'livenet', true],`
   }]);

   await replaceInFile('bitcore-wallet-client/src/lib/common/utils.ts', [{
      key: 'xrp: Bitcore',
      value: `xrp: Bitcore,
  city: require('@blockcore/bitcore-lib-city'),
  exos: require('@blockcore/bitcore-lib-exos'),
  ruta: require('@blockcore/bitcore-lib-ruta'),
  xlr: require('@blockcore/bitcore-lib-xlr'),
  strat: require('@blockcore/bitcore-lib-strat'),
  x42: require('@blockcore/bitcore-lib-x42'),
  xds: require('@blockcore/bitcore-lib-xds'),`
   }, {
      key: "$.checkState(_.includes(_.values(Constants.SCRIPT_TYPES), txp.addressType));",
      value: `if (['city', 'exos', 'ruta', 'xlr', 'strat', 'x42', 'xds'].indexOf(coin) > -1) {
        t.nTime = txp.createdOn; // TODO: Add PoSv4 handling.
      }

      $.checkState(_.includes(_.values(Constants.SCRIPT_TYPES), txp.addressType));`
   }]);

   await replaceInFile('bitcore-wallet-client/src/lib/paypro.ts', [{
      key: 'bch: BitcoreLibCash',
      value: `bch: BitcoreLibCash,
  city: require('@blockcore/bitcore-lib-city'),
  exos: require('@blockcore/bitcore-lib-exos'),
  ruta: require('@blockcore/bitcore-lib-ruta'),
  xlr: require('@blockcore/bitcore-lib-xlr'),
  strat: require('@blockcore/bitcore-lib-strat'),
  x42: require('@blockcore/bitcore-lib-x42'),
  xds: require('@blockcore/bitcore-lib-xds'),`
   }]);

   await replaceInFile('bitcore-wallet-client/src/lib/payproV2.ts', [{
      key: "bch: require('crypto-wallet-core').BitcoreLibCash",
      value: `bch: require('@blockcore/crypto-wallet-core').BitcoreLibCash,
  city: require('@blockcore/bitcore-lib-city'),
  exos: require('@blockcore/bitcore-lib-exos'),
  ruta: require('@blockcore/bitcore-lib-ruta'),
  xlr: require('@blockcore/bitcore-lib-xlr'),
  strat: require('@blockcore/bitcore-lib-strat'),
  x42: require('@blockcore/bitcore-lib-x42'),
  xds: require('@blockcore/bitcore-lib-xds'),`
   }]);

   // TODO: Add support for all blockcore chains!
   await replaceInFile('bitcore-wallet-client/src/lib/key.ts', [{
      key: "coinCode = '144';",
      value: `coinCode = '144';
       } else if (opts.coin == 'city') {
         coinCode = '1926';
       } else if (opts.coin == 'xds') {
         coinCode = '15118976';`
   }]);

   await replaceInFile('bitcore-wallet-client/src/lib/common/constants.ts', [{
      key: "COINS: ['btc', 'bch', 'eth', 'xrp', 'usdc', 'pax', 'gusd', 'busd']",
      value: `COINS: ['btc', 'bch', 'eth', 'xrp', 'usdc', 'pax', 'gusd', 'busd', 'city', 'exos', 'ruta', 'xlr', 'strat', 'x42', 'xds']`
   }, {
      key: "UTXO_COINS: ['btc', 'bch']",
      value: `UTXO_COINS: ['btc', 'bch', 'city', 'exos', 'ruta', 'xlr', 'strat', 'x42', 'xds']`
   }]);

   await replaceInFile('crypto-wallet-core/src/derivation/index.ts', [{
      key: "import { BtcDeriver } from './btc';",
      value: `import { BtcDeriver } from './btc';
      import { CityDeriver } from './city';
      import { ExosDeriver } from './exos';
      import { RutaDeriver } from './ruta';
      import { XlrDeriver } from './xlr';
      import { StratDeriver } from './strat';
      import { X42Deriver } from './x42';
      import { XdsDeriver } from './xds';`
   }, {
      key: "XRP: new XrpDeriver()",
      value: `XRP: new XrpDeriver(),
  CITY: new CityDeriver(),
  EXOS: new ExosDeriver(),
  RUTA: new RutaDeriver(),
  XLR: new XlrDeriver(),
  STRAT: new StratDeriver(),
  X42: new X42Deriver(),
  XDS: new XdsDeriver(),`
   }]);

   await replaceInFile('crypto-wallet-core/src/transactions/index.ts', [{
      key: "import { BTCTxProvider } from './btc';",
      value: `import { BTCTxProvider } from './btc';
      import { CityTxProvider } from './city';
      import { ExosTxProvider } from './exos';
      import { RutaTxProvider } from './ruta';
      import { XlrTxProvider } from './xlr';
      import { StratTxProvider } from './strat';
      import { X42TxProvider } from './x42';
      import { XdsTxProvider } from './xds';`
   }, {
      key: "XRP: new XRPTxProvider()",
      value: `XRP: new XRPTxProvider(),
  CITY: new CityTxProvider(),
  EXOS: new ExosTxProvider(),
  RUTA: new RutaTxProvider(),
  XLR: new XlrTxProvider(),
  STRAT: new StratTxProvider(),
  X42: new X42TxProvider(),
  XDS: new XdsTxProvider(),`
   }]);

   await replaceInFile('crypto-wallet-core/src/validation/index.ts', [{
      key: "import { BtcValidation } from './btc';",
      value: `import { BtcValidation } from './btc';
      import { CityValidation } from './city';
      import { ExosValidation } from './exos';
      import { RutaValidation } from './ruta';
      import { XlrValidation } from './xlr';
      import { StratValidation } from './strat';
      import { X42Validation } from './x42';
      import { XdsValidation } from './xds';`
   }, {
      key: "XRP: new XrpValidation()",
      value: `XRP: new XrpValidation(),
  CITY: new CityValidation(),
  EXOS: new ExosValidation(),
  RUTA: new RutaValidation(),
  XLR: new XlrValidation(),
  STRAT: new StratValidation(),
  X42: new X42Validation(),
  XDS: new XdsValidation(),`
   }]);

   for (var i = 0; i < chainsAll.length; i++) {
      let chain = chainsAll[i];
      let chainName = chain.name;
      let chainNameCased = chainName.charAt(0).toUpperCase() + chainName.slice(1);
      let chainNameUpper = chainName.toUpperCase();

      await createFolder('bitcore-node/src/modules/' + chainName);
      await copyFile('bitcore-node/src/modules/bitcoin/index.ts', 'bitcore-node/src/modules/' + chainName + '/index.ts');

      console.log('FIXING MODULE');

      await replaceInFile('bitcore-node/src/modules/' + chainName + '/index.ts', [{
         key: "'./p2p'",
         value: "'../bitcoin/p2p'"
      }, {
         key: "'./VerificationPeer'",
         value: "'../bitcoin/VerificationPeer'"
      }, {
         key: "'BTC'",
         value: "'" + chainNameUpper + "'",
         multiple: true
      }, {
         key: "new BTCStateProvider()",
         value: "new BTCStateProvider('" + chainNameUpper + "')"
      }, {
         key: "'bitcore-lib'",
         value: "'bitcore-lib-" + chainName + "'"
      }, {
         key: "BitcoinModule",
         value: chainNameCased + "Module"
      }]);

      let chainDerivation = `const BitcoreLib = require('bitcore-lib-` + chainName + `');
      import { AbstractBitcoreLibDeriver } from '../btc';
      export class ` + chainNameCased + `Deriver extends AbstractBitcoreLibDeriver {
        bitcoreLib = BitcoreLib;
      }
      `;

      await createFolder('crypto-wallet-core/src/derivation/' + chainName);
      await writeFile('crypto-wallet-core/src/derivation/' + chainName + '/index.ts', chainDerivation);


      let chainTransaction = `import { BTCTxProvider } from '../btc';

      export class ` + chainNameCased + `TxProvider extends BTCTxProvider {
        lib = require('bitcore-lib-` + chainName + `');
      }
      `;

      await createFolder('crypto-wallet-core/src/transactions/' + chainName);
      await writeFile('crypto-wallet-core/src/transactions/' + chainName + '/index.ts', chainTransaction);


      await createFolder('crypto-wallet-core/src/validation/' + chainName);
      await copyFile('crypto-wallet-core/src/validation/btc/index.ts', 'crypto-wallet-core/src/validation/' + chainName + '/index.ts');
      await replaceInFile('crypto-wallet-core/src/validation/' + chainName + '/index.ts', [{
         key: "'bitcore-lib'",
         value: "'bitcore-lib-" + chainName + "'"
      }, {
         key: 'BtcValidation',
         value: chainNameCased + 'Validation'
      }]);

   }



   // TODO: Add support for additional chains, all wired to "city" right now.
   await replaceInFile('bitcore-wallet-service/src/lib/server.ts', [{
      key: "xrp: Bitcore",
      value: `xrp: Bitcore,
      city: require('@blockcore/bitcore-lib-city'),
      exos: require('@blockcore/bitcore-lib-exos'),
      ruta: require('@blockcore/bitcore-lib-ruta'),
      xlr: require('@blockcore/bitcore-lib-xlr'),
      strat: require('@blockcore/bitcore-lib-strat'),
      x42: require('@blockcore/bitcore-lib-x42'),
      xds: require('@blockcore/bitcore-lib-xds')`
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/common/utils.ts', [{
      key: "bch: require('bitcore-lib-cash')",
      value: `bch: require('bitcore-lib-cash'),
      city: require('@blockcore/bitcore-lib-city'),
      exos: require('@blockcore/bitcore-lib-exos'),
      ruta: require('@blockcore/bitcore-lib-ruta'),
      xlr: require('@blockcore/bitcore-lib-xlr'),
      strat: require('@blockcore/bitcore-lib-strat'),
      x42: require('@blockcore/bitcore-lib-x42'),
      xds: require('@blockcore/bitcore-lib-xds')`
   }]);

   // TODO: Add support for additional chains, all wired to "city" right now.
   await replaceInFile('bitcore-wallet-service/src/lib/model/wallet.ts', [{
      key: "xrp: require('bitcore-lib')",
      value: `xrp: require('bitcore-lib'),
      city: require('@blockcore/bitcore-lib-city'),
      exos: require('@blockcore/bitcore-lib-exos'),
      ruta: require('@blockcore/bitcore-lib-ruta'),
      xlr: require('@blockcore/bitcore-lib-xlr'),
      strat: require('@blockcore/bitcore-lib-strat'),
      x42: require('@blockcore/bitcore-lib-x42'),
      xds: require('@blockcore/bitcore-lib-xds')`
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/chain/index.ts', [{
      key: "XRP: new XrpChain()",
      value: `  XRP: new XrpChain(),
      CITY: new CityChain(),
      EXOS: new ExosChain(),
      RUTA: new RutaChain(),
      XLR: new XlrChain(),
      STRAT: new StratChain(),
      X42: new X42Chain(),
      XDS: new XdsChain()`
   }, {
      key: "import { XrpChain } from './xrp';",
      value: `import { XrpChain } from './xrp';
      import { CityChain } from './city';
      import { ExosChain } from './exos';
      import { RutaChain } from './ruta';
      import { XlrChain } from './xlr';
      import { StratChain } from './strat';
      import { X42Chain } from './x42';
      import { XdsChain } from './xds';`
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/common/constants.ts', [{
      key: "BUSD: 'busd'", // Exists twice in file, but regular replace only replace first instance.
      value: `BUSD: 'busd',
      CITY: 'city',
      EXOS: 'exos',
      RUTA: 'ruta',
      XLR: 'xlr',
      STRAT: 'strat',
      X42: 'x42',
      XDS: 'xds'`
   }, {
      key: `  UTXO_COINS: {
    BTC: 'btc',
    BCH: 'bch'
  },`,
      value: `  UTXO_COINS: {
    BTC: 'btc',
    BCH: 'bch',
    CITY: 'city',
    EXOS: 'exos',
    RUTA: 'ruta',
    XLR: 'xlr',
    STRAT: 'strat',
    X42: 'x42',
    XDS: 'xds'
  },`
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/blockchainexplorers/v8.ts', [{
      key: "xrp: Bitcore",
      value: `xrp: Bitcore,
      city: require('@blockcore/bitcore-lib-city'),
      exos: require('@blockcore/bitcore-lib-exos'),
      ruta: require('@blockcore/bitcore-lib-ruta'),
      xlr: require('@blockcore/bitcore-lib-xlr'),
      strat: require('@blockcore/bitcore-lib-strat'),
      x42: require('@blockcore/bitcore-lib-x42'),
      xds: require('@blockcore/bitcore-lib-xds')`
   }]);

   copyFolderSync('bitcore-wallet-service/src/lib/chain/btc', 'bitcore-wallet-service/src/lib/chain/blockcore');

   // 1. Copy the "bitcore-lib" and create chain specific copies of the library.
   // 2. Run replacement that is generic, and custom if needed.

   var explorerUrls = '';

   for (var i = 0; i < chainsAll.length; i++) {
      let chain = chainsAll[i];
      let chainName = chain.name;

      explorerUrls += chainName + `: {
         livenet: 'https://` + chainName + `.api.blockcore.net',
         testnet: 'https://` + chainName + `.api.blockcore.net'
       },`;
   }

   await replaceInFile('bitcore-wallet-service/src/lib/blockchainexplorer.ts', [{
      key: `testnet: 'https://api-xrp.bitcore.io'
   },`,
      value: `testnet: 'https://api-xrp.bitcore.io'
   },` + explorerUrls
   }]);

   for (var i = 0; i < chainsAll.length; i++) {
      let chain = chainsAll[i];
      let chainName = chain.name;
      let chainNameCased = chainName.charAt(0).toUpperCase() + chainName.slice(1);
      let chainNameUpper = chainName.toUpperCase();

      // await copyFile('bitcore-node/src/modules/bitcoin/index.ts', 'bitcore-node/src/modules/' + chainName + '/index.ts');

      // await replaceInFile('bitcore-node/src/modules/' + chainName + '/index.ts', [{
      //    key: "'BTC'",
      //    value: "'" + chainNameUpper + "'"
      // }, {
      //    key: "new BTCStateProvider()",
      //    value: "new BTCStateProvider('" + chainNameUpper + "')"
      // }, {
      //    key: "'bitcore-lib'",
      //    value: "'bitcore-lib-" + chainName + "'"
      // }, {
      //    key: "BitcoinModule",
      //    value: chainNameCased + "Module"
      // }]);

      let chainDefinition = `import { BitcoreLib` + chainNameCased + ` } from 'crypto-wallet-core';
      import { IChain } from '..';
      import { BtcChain } from '../btc';
      
      export class ` + chainNameCased + `Chain extends BtcChain implements IChain {
        constructor() {
          super(BitcoreLib` + chainNameCased + `);
        }
      }
      `;

      await createFolder('bitcore-wallet-service/src/lib/chain/' + chainName);
      await writeFile('bitcore-wallet-service/src/lib/chain/' + chainName + '/index.ts', chainDefinition);
   }

   var packages = chainsAll.map(item => { return '"bitcore-lib-' + item.name + '": "^8.22.2",' }).join(`
   `);

   await replaceInFile('crypto-wallet-core/package.json', [{
      key: '"bitcore-lib": "^8.22.2",',
      value: `"bitcore-lib": "^8.22.2",
      ` + packages
   }, {
      key: `"crypto-wallet-core"`,
      value: `"@blockcore/crypto-wallet-core"`
   }]);

   await replaceInFile('bitcore-wallet-client/package.json', [{
      key: `"bitcore-wallet-client"`,
      value: `"@blockcore/bitcore-wallet-client"` // Replace name of package
   }, {
      key: `"crypto-wallet-core"`,
      value: `"@blockcore/crypto-wallet-core"` // Replace name of dependencies
   }]);

   await replaceInFile('bitcore-node/package.json', [{
      key: '"bitcore-lib": "^8.22.2",',
      value: `"bitcore-lib": "^8.22.2",
      ` + packages
   }]);

   for (var i = 0; i < chainsAll.length; i++) {
      let chain = chainsAll[i];
      let chainName = chain.name;
      let chainNameCased = chainName.charAt(0).toUpperCase() + chainName.slice(1);
      let libName = 'bitcore-lib-' + chainName;

      copyFolderSync('bitcore-lib', libName);

      await replaceInFile(libName + '/package.json', [{
         key: '"name": "bitcore-lib"',
         value: '"name": "' + libName + '"'
      }]);

      await replaceInFile(libName + '/index.js', [{
         key: "bitcore.versionGuard(global._bitcore);",
         value: `bitcore.versionGuard(global._bitcore` + chainNameCased + `);`
      }, {
         key: "global._bitcore = bitcore.version;",
         value: `global._bitcore` + chainNameCased + ` = bitcore.version;`
      }]);

      await replaceInFile(libName + '/lib/block/blockheader.js', [{
         key: "function _fromBufferReader(br)",
         value: `function _fromBufferReader(br, extraByte = true)`
      }, {
         key: "function fromBufferReader(br)",
         value: `function fromBufferReader(br, extraByte)`
      }, {
         key: `BlockHeader.fromBufferReader = function fromBufferReader(br) {
  var info = BlockHeader._fromBufferReader(br);`,
         value: `BlockHeader.fromBufferReader = function fromBufferReader(br, extraByte) {
  var info = BlockHeader._fromBufferReader(br, extraByte);`
      }, {
         key: "info.nonce = br.readUInt32LE();",
         value: `info.nonce = br.readUInt32LE();
  if(extraByte)
  {
     info.txCount = br.read(1); // Blockcore adds an additional counter to the end of a header. 
  }`
      }]);

      // TODO: Check if this value should be FALSE or TRUE! Trying out "true" for now.
      await replaceInFile(libName + '/lib/block/block.js', [{
         key: "info.header = BlockHeader.fromBufferReader(br);",
         value: `info.header = BlockHeader.fromBufferReader(br, true);`
      }]);

      await replaceInFile(libName + '/lib/transaction/transaction.js', [{
         key: "writer.writeInt32LE(this.version);",
         value: `writer.writeInt32LE(this.version);
  writer.writeUInt32LE(this.nTime);`
      }, {
         key: "this.version = reader.readInt32LE();",
         value: `this.version = reader.readInt32LE();

  // Blockcore adds nTime to the transaction - TODO: This is not compatible with PoSv4.
  this.nTime = reader.readUInt32LE();`
      }, {
         key: "version: this.version,",
         value: `version: this.version,
    nTime: this.nTime,`
      }, {
         key: "this.version = transaction.version;",
         value: `this.version = transaction.version;
  this.nTime = transaction.nTime;`
      }]);

      await replaceInFile(libName + '/lib/networks.js', [{
         key: "pubkeyhash: 0x00,",
         value: `pubkeyhash: 0x1C, // 28`
      }, {
         key: "privatekey: 0x80,",
         value: `privatekey: 0xED, // 237`
      }, {
         key: "scripthash: 0x05,",
         value: `scripthash: 0x58, // 88`
      }, {
         key: "bech32prefix: 'bc',",
         value: `bech32prefix: 'city',`
      }, {
         key: "networkMagic: 0xf9beb4d9,",
         value: `networkMagic: 0x43545901, // "01-59-54-43"`
      }, {
         key: "port: 8333,",
         value: `port: 4333,`
      }, {
         key: "seed.bitcoin.sipa.be",
         value: `seed.city-chain.org`
      }, {
         key: "dnsseed.bluematt.me",
         value: `seed.citychain.foundation`
      }, {
         key: "dnsseed.bitcoin.dashjr.org",
         value: `seed.city-coin.org`
      }, {
         key: "seed.bitcoinstats.com",
         value: `seed.liberstad.com`
      }, {
         key: "seed.bitnodes.io",
         value: `city.seed.blockcore.net`
      }, {
         key: "'bitseed.xf2.org'",
         value: "",
         skipvalidation: true
      }]);

   }

})().catch(e => {
   console.error(e);
});
