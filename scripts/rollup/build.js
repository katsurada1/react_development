const argv = require('minimist')(process.argv.slice(2));
const Bundles = require('./bundles');
const Packaging = require('./packaging');

const {
  NODE_PROD
} = Bundles.bundleTypes;

const {getFilename} = Bundles;

function parseRequestedNames(names, toCase) {
  let result = [];
  for (let i = 0; i < names.length; i++) {
    let splitNames = names[i].split(',');
    for (let j = 0; j < splitNames.length; j++) {
      let name = splitNames[j].trim();
      if (!name) {
        continue;
      }
      if (toCase === 'uppercase') {
        name = name.toUpperCase();
      } else if (toCase === 'lowercase') {
        name = name.toLowerCase();
      }
      result.push(name);
    }
  }
  return result;
}

const requestedBundleTypes = argv.type
  ? parseRequestedNames([argv.type], 'uppercase')
  : [];

buildEverything();

async function buildEverything() {
  let bundles = [];
  for (const bundle of Bundles.bundles) {
    bundles.push(
      [bundle, NODE_PROD]
    );
  }

  bundles = bundles.filter(([bundle, bundleType]) => {
    return true;
  });

  for (const [bundle, bundleType] of bundles) {
    await createBundle(bundle, bundleType);
  }

}

async function createBundle(bundle, bundleType) {
  const filename = getFilename(bundle, bundleType);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.entry);
  console.log(packageName);
}

function getFormat(bundleType) {
  switch(bundleType) {
    case NODE_PROD:
      return 'cjs';
  }
}