'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */
const fs = require('fs');
const {spawnSync} = require('child_process');

const {
  ReactVersion
} = require('../../ReactVersions');

const sha = String(
  spawnSync('git', ['show', '-s', '--no-show-signature', '--format=%h']).stdout
).trim();

let dateString = String(
  spawnSync('git', [
    'show',
    '-s',
    '--no-show-signature',
    '--format=%cd',
    '--date=format:%Y%m%d',
    sha,
  ]).stdout
).trim();

const PLACEHOLDER_REACT_VERSION = ReactVersion + '-' + sha + '-' + dateString;

fs.writeFileSync(
  './packages/shared/ReactVersion.js',
  `export default '${PLACEHOLDER_REACT_VERSION}';\n`
);


buildForChannel('stable', '', '');

function buildForChannel(channel, nodeTotal, nodeIndex) {
  const {status} = spawnSync(
    'node',
    ['./scripts/rollup/build.js', ...process.argv.slice(2)],
    {
      stdio: ['pipe', process.stdout, process.stderr],
      env: {
        ...process.env,
        RELEASE_CHANNEL: channel,
        CIRCLE_NODE_TOTAL: nodeTotal,
        CIRCLE_NODE_INDEX: nodeIndex,
      }
    },
  );

  if (status !== 0) {
    process.exit(status);
  }
}