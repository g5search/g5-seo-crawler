const Crawler = require('./crawler')
const audits = require('./audits')

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
    this.beforeAudit = []
    this.afterAudit = []
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
  
}
