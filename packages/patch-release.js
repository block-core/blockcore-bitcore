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

      if (skipvalidation || data.indexOf(val) == -1) {
         data = data.replace(key, val);
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

   var chainsAll = [{ name: 'city' }, { name: 'exos' }, { name: 'ruta' }, { name: 'strat' }, { name: 'x42' }, { name: 'xds' }, { name: 'xlr' }];

   await replaceInFile('crypto-wallet-core/package.json', [{
      key: '"bitcore-lib": "^8.22.2",',
      value: `"bitcore-lib": "git+https://github.com/block-core/blockcore-bitcore/packages/bitcore-lib",
      "bitcore-lib-city": "git+https://github.com/block-core/blockcore-bitcore/packages/bitcore-lib-city",`
   }, {
      key: '"bitcore-lib-cash": "^8.22.2",',
      value: `"bitcore-lib-cash": "git+https://github.com/block-core/blockcore-bitcore/packages/bitcore-lib-cash",`
   }]);

})().catch(e => {
   console.error(e);
});

