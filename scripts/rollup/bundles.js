'use strict';

const bundleTypes = {
  // NODE_ES2015: 'NODE_ES2015',
  NODE_PROD: 'NODE_PROD',
};

const {
  // NODE_ES2015
  NODE_PROD
} = bundleTypes;

const moduleTypes = {
  ISOMORPHIC: 'ISOMORPHIC'
}

const {ISOMORPHIC} = moduleTypes;

const bundles = [
  {
    bundleTypes: [
      // UMD_DEV,
      // UMD_PROD,
      // UMD_PROFILING,
      // NODE_DEV,
      NODE_PROD,
      // FB_WWW_DEV,
      // FB_WWW_PROD,
      // FB_WWW_PROFILING,
      // RN_FB_DEV,
      // RN_FB_PROD,
      // RN_FB_PROFILING,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react',
    global: 'React',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
    externals: ['ReactNativeInternalFeatureFlags'],
  }
];

function getFilename(bundle, bundleType) {
  let name = bundle.entry;
  const globalName = bundle.global;
  switch(bundleType) {
    case NODE_PROD:
      return `${name}.production.min.js`;
  }
}

module.exports = {
  bundles,
  bundleTypes,
  getFilename
}