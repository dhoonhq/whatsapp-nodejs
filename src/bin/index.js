const fse = require('fs-extra');
const path = require('path');

let isDev = false;

if (fse.pathExistsSync(path.join(__dirname, './darwin'))) {
  if (fse.existsSync(path.join(__dirname, './darwin/d0.js'))) {
    isDev = true;
  }
}

const basePath = isDev ? './darwin/' : './linux/';

const files = fse.readdirSync(path.join(__dirname, basePath)).filter(item => item[0] !== '.');

const obj = {};
for (let i = 0; i < files.length; i++) {
  // eslint-disable-next-line
  obj[`d${i}`] = require(`${basePath}d${i}`);
}

module.exports = obj;
