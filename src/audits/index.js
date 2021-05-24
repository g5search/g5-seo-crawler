const fs = require('fs')
const path = require('path')
const audits = {}

fs
  .readdirSync(__dirname)
  .filter(f => f.indexOf('.') !== 0 && f !== 'index.js' && f !== 'README.md')
  .forEach((f) => {
    const audit = require(path.join(__dirname, f))
    const { name } = audit.getDetails()
    console.log(`Loaded ${name} Audit.`)
    audits[name] = audit
  })

module.exports = Object.assign(audits)
