'use strict';

function getPackageName(name) {
  if (name.indexOf('/') !== -1) {
    return name.split('/')[0];
  }
  return name;
}

module.exports = {
  getPackageName
}