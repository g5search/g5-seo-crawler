const Crawler = require('./crawler')
const audits = require('./audits')
const metadata = require('./metadata')
const hub = require('./hub')
const domain = require('./utilities/domain')

const fallbackAudits = {
  "alt-text": true,
  "external-links": true,
  "h1": true,
  "internal-links": true,
  "inventory-links": false,
  "keywords": false,
  "nav": false,
  "social-links": true,
  "title-tags": true
}
module.exports = class Auditer extends Crawler {
  constructor (params) {
    super(params)
    this._config = params.config
    this._audits = audits
    this._enabledAudits = params.enabledAudits ? params.enabledAudits : fallbackAudits
    this._metadata = {}
    this._enabledMetadata = metadata
    this._hub = {}
    this._audit = []
    this._hooks = [
      '_beforeAudit',
      '_audit',
      '_afterAudit'
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

  set hub (val) { this._hub = val }
  get hub () { return this._hub }

  get audit () { return this._audit }
  get hooks () { return this._hooks }

  set results ({ results, url }) {
    this._results[url] = results
  }
  get results () {
    return {
      results: this._results,
      locationUrn: this.locationUrn,
      clientUrn: this.clientUrn
    }
  }

  init () {
    console.log(`Auditing ${this._homepage}`)
    this.rootDomain = domain.root(this._homepage)

    if (domain.isPath(this._rootDomain)) {
      this.rootDomain = this._rootDomain.slice(0, -1)
    }

    this.addAudits()
  }

  addAudits () {
    Object
      .keys(this._enabledAudits)
      .forEach((key) => {
        if (this._enabledAudits[key]) {
          const details = this._audits[key].getDetails()
          this.addAudit(key, this._audits[key].run, details)
        }
      }, this)
  }

  addAudit (name, fn, details) {
    this[details.type].push({
      checkName: name,
      checkFunction: fn,
      ...details
    })
  }

  async runAudit (url, page) {
    const results = []
    this._audit.forEach((check) => {
      results.push(check.checkFunction(this.cheerio, page, url, this))
    })

    return await Promise.all(results)
  }

  async runBeforeAudit (url, page) {
    const results = []
    this._beforeAudit.forEach((check) => {
      results.push(check.checkFunction(this.cheerio, page, url, this))
    })

    return await Promise.all(results)
  }

  async runAfterAudit () {
    const results = []
    this._afterAudit.forEach((check) => {
      results.push(check.checkFunction(this))
    })

    return await Promise.all(results)
  }

  getMetadata (page) {
    const $ = this.cheerio.load(page)
    const metadata = {}

    for (let i = 0; i < Object.keys(this._enabledMetadata).length; i++) {
      const key = Object.keys(this._enabledMetadata)[i]
      metadata[key] = this._enabledMetadata[key]($)
    }

    return metadata
  }

  async start () {
    await this.getSitemap()
    this.init()
    this.hub = await hub.getLocation(this._clientUrn, this._locationUrn)
    await this.getSiteSettings(this._clientUrn, this._locationUrn)
    let url = this._homepage
    let page = await this.requestPage(url)
    this.crawled = url
    this.getLinks(page)
    this._metadata[url] = this.getMetadata(page)

    if (this._beforeAudit.length > 0) {
      const results = await this.runBeforeAudit(url, page)
      this.results = { results, url }
    }

    if (this._audit.length > 0) {
      const results = await this.runAudit(url, page)
      this.results = { results, url }
    }

    while (this._pages.length > 0) {
      url = this.nextPage()
      page = await this.requestPage(url)
      if (page !== 'Failed') {
        this.crawled = url
        this.getLinks(page)
        this._metadata[url] = this.getMetadata(page)
        console.log(url)
      }

      if (!url.includes('blog')) {
        const results = await this.runAudit(url, page)
        this.results = { results, url }
      } else {
        console.log(`Skipped ${url}`)
      }
    }

    if (this._afterAudit.length > 0) {
      const results = await this.runAfterAudit()

      results.forEach(({ name, pass, fail }, i, audit) => {
        this.afterAuditResults(pass, name, 'pass', audit[i])
        this.afterAuditResults(fail, name, 'fail', audit[i])
      })
    }
  }

  afterAuditResults (results, name, key, audit) {
    Object.keys(results).forEach((url) => {
      const isPassing = key === 'pass'
      const pass = isPassing ? audit.pass[url] : []
      const fail = !isPassing ? audit.fail[url] : []
      this.addResults(url, name, pass, fail)
    })
  }

  addResults (url, name, pass, fail) {
    if (url === 'All Pages' && !(url in this._results)) {
      this._results['All Pages'] = []
    }
    if (url !== undefined && this._results[url]) {
      this._results[url].push({ name, fail, pass })
    }
  }
}
