const Crawler = require('./crawler')
const audits = require('./audits')
const domain = require('./utilities/domain')
module.exports = class Auditer extends Crawler {
  constructor (params) {
    super(params)
    this._config = params.config
    this._audits = audits
    this._enabledAudits = params.enabledAudits
    this._metadata = metadata
    this._enabledMetadata = params.enabledMetadata
    this._hub = {}
    this._audit = []
    this._hooks = [
      'beforeAudit',
      'audit',
      'afterAudit'
    ]
    this._beforeAudit = []
    this._afterAudit = []
    this._results = {}
  }

  get config () { return this._config }
  get audits () { return this._audits }
  get enabledAudits () { return this._enabledAudits }
  get metadata () { return this._metadata }
  get enabledMetadata () { return this._enabledMetadata }
  get hub () { return this._hub }
  get audit () { return this._audit }
  get hooks () { return this._hooks }
  get results () { return this._results }

  init () {
    console.log(`Auditing ${this._homepage}`)
    this.rootDomain(domain.root(this._homepage))

    if (domain.isPath(this._rootDomain)) {
      this.rootDomain(this._rootDomain.slice(0, -1))
    }

    this.addAudits()
  }

  addAudits () {
    Object
      .keys(this._enabledAudits)
      .forEach((key) => {
        if (this._enabledAudits[key]) {
          const details = this._audits[key].getDetails()
          this.addAudits(key, this._audits[key].run, details)
        }
      }, this)
  }

  addAudit (name, fn, details) {
    this[details.type].push({
      
    })
  }
}
