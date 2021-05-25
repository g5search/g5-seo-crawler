const fs = require('fs')
const path = require('path')
const metadata = {}

fs
  .readdirSync(__dirname)
  .filter(f => f.indexOf('.') !== 0 && f !== 'index.js' && f !== 'README.md')
  .forEach((f) => {
    const filename = f.replace('.js', '')
    const audit = require(path.join(__dirname, f))
    metadata[filename] = audit
  })

module.exports = Object.assign(metadata)
