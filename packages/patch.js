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
const { readdirSync } = require('fs');
const { dir } = require('console');
var fs2 = require('fs');
var path = require('path');
const { RetrySeconds } = require('./bitcore-p2p/lib/pool');

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



   // We must also patch the original bitcore-lib to support PoS blocks.
   await replaceInFile('bitcore-lib/lib/block/blockheader.js', [{
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
  info.txCount = br.read(1); // Blockcore adds two additional counter to the end of a header. 
  info.txCount2 = br.read(1); // Blockcore adds two additional counter to the end of a header. 
}`
   }]);

   // TODO: Check if this value should be FALSE or TRUE! Trying out "true" for now.
   await replaceInFile('bitcore-lib/lib/block/block.js', [{
      key: "info.header = BlockHeader.fromBufferReader(br);",
      value: `info.header = BlockHeader.fromBufferReader(br, true);`
   }]);

   await replaceInFile('bitcore-lib/lib/transaction/transaction.js', [{
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



   return;



   // var chainsAll = [{ name: 'city', code: 1926 }, { name: 'exos' }, { name: 'ruta' }, { name: 'strat' }, { name: 'x42' }, { name: 'xds', code: 15118976 }, { name: 'xlr' }];
   var chainsAll = [{ name: 'city', code: 1926 }];

   // Process the chains to have ready-made variable names.
   chainsAll.forEach(item => { 
      item.nameCased = item.name.charAt(0).toUpperCase() + item.name.slice(1), 
      item.nameUpper = item.name.toUpperCase(),
      item.libName = 'bitcore-lib-' + item.name  });

   var exports = chainsAll.map(item => { return 'BitcoreLib' + item.nameCased + ',' });

   var imports = chainsAll.map(item => {
      return `import * as BitcoreLib` + item.nameCased + ` from 'bitcore-lib-` + item.name + `';
   `});

   var chainsAsStrings = chainsAll.map(c => "'" + c.name + "'" );

   console.log('Chains:', chainsAll);
   console.log('Exports:', exports);
   console.log('Imports: ', imports);

   // THIS SECTION CAN BE USED TO PREFIX ALL PACKAGE NAMES WITH '@blockcore' AND THE REFERENCES.
   // Unfortunately this will require replacing all imports everywhere, so this is not being done for the moment.

   // // NodeJS is fun... :-(
   // const srcPath = './';
   // const names = fs2.readdirSync(srcPath).filter(file => fs2.statSync(path.join(srcPath, file)).isDirectory());
   // const replacements = names.map(item => { return { key: '"' + item + '"', value: '"@blockcore/' + item + '"'  }  });

   // for(let name of names)
   // {
   //    const jsonPath = path.join(srcPath, name, 'package.json');

   //    await replaceInFile(jsonPath, [{
   //       key: `"` + name + `"`,
   //       value: `"@blockcore/` + name + `"`
   //    }, ...replacements]);
   // }

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

   await replaceInFile('crypto-wallet-core/src/index.ts', [{
      key: "import * as BitcoreLibCash from 'bitcore-lib-cash';",
      value: `import * as BitcoreLibCash from 'bitcore-lib-cash';
      ` + imports.join(' ')
   }, {
      key: "BitcoreLibCash, ",
      value: `BitcoreLibCash, ` + exports.join(' ')
   }]);

   await replaceInFile('crypto-wallet-core/src/derivation/paths.ts', [{
      key: "BTC: {",
      value: chainsAll.map(c => { return c.nameUpper + `: { mainnet: "m/44'/` + c.code + `'/", livenet: "m/44'/` + c.code + `'/" }` }).join(`
      `) + `,
      BTC: {`
   }]);

   // TODO: These values should likely be added to the initial array configuration so we can have different for different chains.
   const constantDefaults1 = chainsAll.map(c => { return c.name + ': 10000 * 1000, // 10k sat/b,' }).join(`
   `);

   const constantDefaults2 = chainsAll.map(c => { return c.name + ': 0,' }).join(`
   `);

   const constantDefaults3 = chainsAll.map(c => { return c.name + ': 0.01,' }).join(`
   `);

   await replaceInFile('crypto-wallet-core/src/constants/units.ts', [{ key: 'btc: {', value: units + 'btc: {' }]);
   await replaceInFile('bitcore-wallet-service/src/lib/common/defaults.ts', [{ key: 'btc: [', value: defaults + 'btc: [' }, {
      key: 'xrp: 1000000000000,',
      value: `xrp: 1000000000000,
      ` + constantDefaults1
   }, {
      key: 'xrp: 0,',
      value: `xrp: 0,
      ` + constantDefaults2
   }, {
      key: 'xrp: 1 * 1e6 // 1 xrp',
      value: `xrp: 1 * 1e6, // 1 xrp
      ` + constantDefaults3
   }]);

   console.log(constantDefaults1);
   console.log(constantDefaults2);
   console.log(constantDefaults3);

   // Copy the sendheaders commands.
   await copyFile('sendheaders.js', 'bitcore-p2p/lib/messages/commands/sendheaders.js');

   await replaceInFile('bitcore-p2p/lib/messages/builder.js', [{
      key: "getaddr: 'GetAddr'", value: `getaddr: 'GetAddr',
      sendheaders: 'SendHeaders'` }]);

   const apiImports = chainsAll.map(c => { return c.name + ': CWC.BitcoreLib' + c.nameCased + ',' }).join(`
   `);

   const apiNetworks1 = chainsAll.map(c => { return "['" + c.name + "', 'livenet']," }).join(`
   `);

   const apiNetworks2 = chainsAll.map(c => { return "['" + c.name + "', 'livenet', true]," }).join(`
   `);

   await replaceInFile('bitcore-wallet-client/src/lib/api.ts', [{
      key: 'xrp: CWC.BitcoreLib',
      value: `xrp: CWC.BitcoreLib,
     ` + apiImports
   }, {
      key: "['bch', 'livenet', true]",
      value: `['bch', 'livenet', true],
           ` + apiNetworks1 + `
           ` + apiNetworks2
   }]);

   const utilsImports = chainsAll.map(c => { return c.name + `: require('` + c.libName + `'),` }).join(`
   `);

   await replaceInFile('bitcore-wallet-client/src/lib/common/utils.ts', [{
      key: 'xrp: Bitcore',
      value: `xrp: Bitcore,
  ` + utilsImports
   }, {
      key: "$.checkState(_.includes(_.values(Constants.SCRIPT_TYPES), txp.addressType));",
      value: `if ([` + chainsAsStrings + `].indexOf(coin) > -1) {
        t.nTime = txp.createdOn; // TODO: Add PoSv4 handling.
      }

      $.checkState(_.includes(_.values(Constants.SCRIPT_TYPES), txp.addressType));`
   }]);

   const payproimports = chainsAll.map(c => { return c.name + `: require('` + c.libName + `'),` }).join(`
   `);

   await replaceInFile('bitcore-wallet-client/src/lib/paypro.ts', [{
      key: 'bch: BitcoreLibCash',
      value: `bch: BitcoreLibCash,
  ` + payproimports
   }]);

   await replaceInFile('bitcore-wallet-client/src/lib/payproV2.ts', [{
      key: "bch: require('crypto-wallet-core').BitcoreLibCash",
      value: `bch: require('crypto-wallet-core').BitcoreLibCash,
  ` + payproimports
   },{
      key: "xrp: 1000000000000",
      value: `xrp: 1000000000000,
  ` + chainsAll.map(c => { return c.name + `: 10000 * 1000,` }).join(`
  `)
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/emailservice.ts', [{
      key: "xrp: 'XRP'",
      value: `xrp: 'XRP',
  ` + chainsAll.map(c => { return c.name + `: '` + c.nameUpper + `',` }).join(`
  `)
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/pushnotificationsservice.ts', [{
      key: "busd: 'BUSD'",
      value: `busd: 'BUSD',
  ` + chainsAll.map(c => { return c.name + `: '` + c.nameUpper + `',` }).join(`
  `)
   }]);
   
   await replaceInFile('bitcore-wallet-service/src/scripts/v8tool-list.ts', [{
      key: "XRP: `https://api-xrp.bitcore.io/api/${coin}/${network}`",
      value: `XRP: ` + "`https://api-xrp.bitcore.io/api/${coin}/${network}`" + `,
  ` + chainsAll.map(c => { return c.nameUpper + `: ` + "`https://" + c.name + ".api.blockcore.net/api/${coin}/${network}`" + `,` }).join(`
  `)
   }]);

   await replaceInFile('bitcore-wallet-service/src/scripts/v8tool.ts', [{
      key: "XRP: `https://api-xrp.bitcore.io/api/${coin}/${network}`",
      value: `XRP: ` + "`https://api-xrp.bitcore.io/api/${coin}/${network}`" + `,
  ` + chainsAll.map(c => { return c.nameUpper + `: ` + "`https://" + c.name + ".api.blockcore.net/api/${coin}/${network}`" + `,` }).join(`
  `)
   }]);

   const keyImports = chainsAll.map(c => { return `} else if (opts.coin == '` + c.name + `') {
      coinCode = '` + c.code + `';` }).join(`
   `);

   // TODO: Add support for all blockcore chains!
   await replaceInFile('bitcore-wallet-client/src/lib/key.ts', [{
      key: "coinCode = '144';",
      value: `coinCode = '144';
       ` + keyImports
   }]);

   await replaceInFile('bitcore-wallet-client/src/lib/common/constants.ts', [{
      key: "COINS: ['btc', 'bch', 'eth', 'xrp', 'usdc', 'pax', 'gusd', 'busd']",
      value: `COINS: ['btc', 'bch', 'eth', 'xrp', 'usdc', 'pax', 'gusd', 'busd', ` + chainsAsStrings  + `]`
   }, {
      key: "UTXO_COINS: ['btc', 'bch']",
      value: `UTXO_COINS: ['btc', 'bch', ` + chainsAsStrings + `]`
   }]);

   await replaceInFile('crypto-wallet-core/src/derivation/index.ts', [{
      key: "import { BtcDeriver } from './btc';",
      value: `import { BtcDeriver } from './btc';
      ` + chainsAll.map(c => { return `import { ` + c.nameCased + `Deriver } from './` + c.name + `';` }).join(`
      `)
   }, {
      key: "XRP: new XrpDeriver()",
      value: `XRP: new XrpDeriver(),
  ` + chainsAll.map(c => { return c.nameUpper + `: new ` + c.nameCased + `Deriver(),` }).join(`
  `)
   }]);

   await replaceInFile('crypto-wallet-core/src/transactions/index.ts', [{
      key: "import { BTCTxProvider } from './btc';",
      value: `import { BTCTxProvider } from './btc';
      ` + chainsAll.map(c => { return `import { ` + c.nameCased + `TxProvider } from './` + c.name + `';` }).join(`
      `)
   }, {
      key: "XRP: new XRPTxProvider()",
      value: `XRP: new XRPTxProvider(),
  ` + chainsAll.map(c => { return c.nameUpper + `: new ` + c.nameCased + `TxProvider(),` }).join(`
  `)
   }]);

   await replaceInFile('crypto-wallet-core/src/validation/index.ts', [{
      key: "import { BtcValidation } from './btc';",
      value: `import { BtcValidation } from './btc';
      ` + chainsAll.map(c => { return `import { ` + c.nameCased + `Validation } from './` + c.name + `';` }).join(`
      `)
   }, {
      key: "XRP: new XrpValidation()",
      value: `XRP: new XrpValidation(),
  ` + chainsAll.map(c => { return c.nameUpper + `: new ` + c.nameCased + `Validation(),` }).join(`
  `)
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

   var keyAndRequireImport = chainsAll.map(c => { return c.name + `: require('` + c.libName + `'),` }).join(`
   `)

   var localImports = chainsAll.map(c => { return `import { ` + c.nameCased + `Chain } from './` + c.name + `';` }).join(`
   `)

   // TODO: Add support for additional chains, all wired to "city" right now.
   await replaceInFile('bitcore-wallet-service/src/lib/server.ts', [{
      key: "xrp: Bitcore",
      value: `xrp: Bitcore,
      ` + keyAndRequireImport
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/common/utils.ts', [{
      key: "bch: require('bitcore-lib-cash')",
      value: `bch: require('bitcore-lib-cash'),
      ` + keyAndRequireImport
   }]);

   // TODO: Add support for additional chains, all wired to "city" right now.
   await replaceInFile('bitcore-wallet-service/src/lib/model/wallet.ts', [{
      key: "xrp: require('bitcore-lib')",
      value: `xrp: require('bitcore-lib'),
      ` + keyAndRequireImport
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/chain/index.ts', [{
      key: "XRP: new XrpChain()",
      value: `  XRP: new XrpChain(),
      ` + chainsAll.map(c => { return c.nameUpper + `: new ` + c.nameCased + `Chain(),` }).join(`
      `)
   }, {
      key: "import { XrpChain } from './xrp';",
      value: `import { XrpChain } from './xrp';
      ` + localImports
   }]);

   var upperToLowerMapping = chainsAll.map(c => { return c.nameUpper + `: '` + c.name + `',` }).join(`
   `)

   await replaceInFile('bitcore-wallet-service/src/lib/common/constants.ts', [{
      key: "BUSD: 'busd'", // Exists twice in file, but regular replace only replace first instance.
      value: `BUSD: 'busd',
      ` + upperToLowerMapping
   }, {
      key: `  UTXO_COINS: {
    BTC: 'btc',
    BCH: 'bch'
  },`,
      value: `  UTXO_COINS: {
    BTC: 'btc',
    BCH: 'bch',
    ` + upperToLowerMapping + `
  },`
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/blockchainexplorers/v8.ts', [{
      key: "xrp: Bitcore",
      value: `xrp: Bitcore,
      ` + keyAndRequireImport
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
      key: `btc: {`,
      value: explorerUrls + `btc: {`
   }]);

   await replaceInFile('bitcore-wallet-service/src/lib/blockchainmonitor.ts', [{
      key: `xrp: {}`,
      value:`xrp: {},
      ` + chainsAll.map(c => { return c.name + `: {},` }).join(`
      `)
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


   // await replaceInFile('bitcore-build/package.json', [{
   //    key: `"bitcore-build"`,
   //    value: `"@blockcore/bitcore-build"`
   // }]);

   // await replaceInFile('bitcore-client/package.json', [{
   //    key: `"bitcore-client"`,
   //    value: `"@blockcore/bitcore-client"`
   // }, {
   //    key: 'bitcore-mnemonic',
   //    value: '@blockcore/bitcore-mnemonic'
   // }, {
   //    key: 'crypto-wallet-core',
   //    value: '@blockcore/crypto-wallet-core'
   // }]);

   // await replaceInFile('bitcore-lib/package.json', [{
   //    key: `"bitcore-lib"`,
   //    value: `"@blockcore/bitcore-lib"`
   // }, {
   //    key: 'bitcore-build',
   //    value: '@blockcore/bitcore-build'
   // }]);

   // await replaceInFile('bitcore-lib-cash/package.json', [{
   //    key: `"bitcore-lib-cash"`,
   //    value: `"@blockcore/bitcore-lib-cash"`
   // }, {
   //    key: 'bitcore-lib',
   //    value: '@blockcore/bitcore-lib'
   // }, {
   //    key: 'bitcore-build',
   //    value: '@blockcore/bitcore-build'
   // }]);

   // await replaceInFile('bitcore-lib-ltc/package.json', [{
   //    key: `"bitcore-lib-ltc"`,
   //    value: `"@blockcore/bitcore-lib-ltc"`
   // }, {
   //    key: 'bitcore-build',
   //    value: '@blockcore/bitcore-build'
   // }]);

   // await replaceInFile('bitcore-mnemonic/package.json', [{
   //    key: `"bitcore-mnemonic"`,
   //    value: `"@blockcore/bitcore-mnemonic"`
   // }, {
   //    key: 'bitcore-build',
   //    value: '@blockcore/bitcore-build'
   // }, {
   //    key: 'bitcore-lib',
   //    value: '@blockcore/bitcore-lib',
   //    multiple: true
   // }]);

   // await replaceInFile('bitcore-node/package.json', [{
   //    key: `"bitcore-node"`,
   //    value: `"@blockcore/bitcore-node"`
   // }, {
   //    key: 'bitcore-build',
   //    value: '@blockcore/bitcore-build'
   // }, {
   //    key: 'bitcore-lib',
   //    value: '@blockcore/bitcore-lib',
   //    multiple: true
   // }]);

   // await replaceInFile('bitcore-wallet-client/package.json', [{
   //    key: `"bitcore-wallet-client"`,
   //    value: `"@blockcore/bitcore-wallet-client"` // Replace name of package
   // }, {
   //    key: `"crypto-wallet-core"`,
   //    value: `"@blockcore/crypto-wallet-core"` // Replace name of dependencies
   // }]);

   await replaceInFile('crypto-wallet-core/package.json', [{
      key: '"bitcore-lib": "^8.22.2",',
      value: `"bitcore-lib": "^8.22.2",
      ` + packages
   }]);

   await replaceInFile('bitcore-node/package.json', [{
      key: '"bitcore-lib": "^8.22.2",',
      value: `"bitcore-lib": "^8.22.2",
      ` + packages
   }]);

   await replaceInFile('bitcore-wallet-service/package.json', [{
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
      
      await replaceInFile(libName + '/lib/crypto/point.js', [{
         key: "Point.prototype._getX = Point.prototype.getX;",
         value: `if (!Point.prototype._getX)
         Point.prototype._getX = Point.prototype.getX;`
      }, {
         key: "Point.prototype._getY = Point.prototype.getY;",
         value: `if (!Point.prototype._getY)
         Point.prototype._getY = Point.prototype.getY;`
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
     info.txCount = br.read(1); // Blockcore adds two additional counter to the end of a header. 
     info.txCount2 = br.read(1); // Blockcore adds two additional counter to the end of a header. 
  }`
      }]);

      // This should be false, since the BlockHeader is reused for Header and Block reading.
      await replaceInFile(libName + '/lib/block/block.js', [{
         key: "info.header = BlockHeader.fromBufferReader(br);",
         value: `info.header = BlockHeader.fromBufferReader(br, false);`
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
