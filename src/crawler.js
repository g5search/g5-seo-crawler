const https = require('https')
const cheerio = require('cheerio')
const axios = require('axios').create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const hub = require('./hub')
const cms = require('./cms')
const sitemapper = require('./utilities/sitemapper')

module.exports = class Crawler {
  constructor (params) {
    this.cheerio = cheerio
    this.axios = axios
    this._pages = []
    this._crawled = []
    this._homepage = params.url ? params.url : params.rootDomain
    this._rootDomain = params.rootDomain
    this._errors = []
    this._externalLinks = []
    this._singleDomain = false
    this._corporate = false
    this._clientUrn = params.clientUrn
    this._locationUrn = params.locationUrn
    this._sitemapUrl = null
    this._vertical = null
    this._locationName = null
    this._discoverLinks = params.discoverLinks || true
  }

  set pages (val) {
    if (Array.isArray(val)) {
      this._pages = val
    } else {
      this._pages.push(val)
    }
  }
  get pages () { return this._pages }

  set crawled (url) { this._crawled.push(url) }
  get crawled () { return this._crawled }

  set homepage (url) { this._homepage = url }
  get homepage () { return this._homepage }

  set rootDomain (domain) { this._rootDomain = domain }
  get rootDomain () { return this._rootDomain }

  set errors (err) { this._errors.push(err) }
  get errors () { return this._errors }

  get externalLinks () { return this._externalLinks }

  set singleDomain (val) { this._singleDomain = val }
  get singleDomain () { return this._singleDomain }

  set isCorporate (val) { this._corporate = val}
  get isCorporate () { return this._corporate }

  set clientUrn (urn) { this._clientUrn = urn }
  get clientUrn () { return this._clientUrn }

  set locationUrn (urn) { this._locationUrn = urn }
  get locationUrn () { return this._locationUrn }

  set sitemapUrl (url) { this._sitemapUrl = url }
  get sitemapUrl () { return this._sitemapUrl }

  set vertical (val) { this._vertical = val }
  get vertical () { return this._vertical }

  set locationName (name) { this._locationName = name }
  get locationName () { return this._locationName }

  set discoverLinks (val) { this._discoverLinks = val }
  get discoverLinks () { return this._discoverLinks }

  get locationInfo () {
    return {
      name: this._locationName,
      locationUrn: this._locationUrn,
      clientUrn: this._clientUrn
    }
  }

  /**
   * @memberof Crawler
   * @param {String} page 
   */
  getLinks (page) {
    const $ = this.cheerio.load(page)
    const anchors = $('a:not(.number)').toArray()

    anchors.forEach((a) => {
      /**
       * Format links and reject links with no content
       */
      if (
        a.attribs &&
        a.attribs.href &&
        !a.attribs.href.includes('tel:') &&
        !a.attribs.href.includes('mailto:') &&
        !a.attribs.href.includes('#') &&
        !a.attribs.href.includes('.jpg') &&
        !a.attribs.href.includes('hud.gov')
      ) {
        let link = a.attribs.href

        if (link.charAt(0) === '/') {
          link = `${this.rootDomain}${link}`
        } else if (
          !/\.(com|net|org|biz|ca|care)/.test(link) &&
          !link.includes('javascript:void(0);')
        ) {
          link = `${this.rootDomain}/${link}`
        }

        /**
         * Sort internal and external links
         * Handle edge cases specific to G5
         */
        if (
          link.includes(this._homepage) &&
          this._discoverLinks
        ) {
          if (
            !this._pages.includes(link) &&
            !this._crawled.includes(link) &&
            !this._errors.includes(link)
          ) {
            if (this.isCorporate) {
              const directoryCount = link.split('/')
              if (directoryCount.length < 5) {
                this.pages = link
              }
            } else {
              this.pages = link
            }
          }
        } else if (
          !this._externalLinks.includes(link) &&
          !link.includes(this._homepage)
        ) {
          this._externalLinks.push(link)
        }
      }
    }, this)
  }

  requestPage (url) {
    return this.axios.get(url)
      .then(res => res.data)
      .catch(err => 'Failed')
  }

  nextPage () {
    return this._pages.pop()
  }

  async getSitemap () {
    if (this.locationUrn) {
      const sitemapType = await hub.getSitemapType(this.locationUrn, this.clientUrn)

      if (sitemapType && sitemapType.home_page_url) {
        this.homepage = sitemapType.home_page_url
      }
      this.rootDomain = sitemapType.rootDomain
      this.vertical = sitemapType.vertical

      if (sitemapType.domain_type === 'SingleDomainClient') {
        this.sitemapUrl = await cms.getSitemapUrl(this.locationUrn, this.clientUrn, sitemapType.rootDomain)
      } else {
        this.sitemapUrl = `${this.rootDomain}/sitemap.xml`
      }

      const pages = await sitemapper(this.sitemapUrl)
      this.pages = pages.sites
      this.discoverLinks = false
    }
  }

  async getSiteSettings (clientUrn, locationUrn) {
    const client = await hub.getClient(clientUrn)
    const location = await hub.getLocation(clientUrn, locationUrn)
    this.isCorporate = location.location.corporate
    this.locationName = location.location.internal_branded_name
      ? location.location.internal_branded_name
      : location.location.name
    this.singleDomain = client.client.domain_type !== 'MultiDomainClient'
  }

  getDataLayer (page) {
    let siteDataLayer = null
    const $ = this.cheerio.load(page)
    const scripts = $('script').toArray()

    scripts.forEach((script) => {
      const text = $(script.childNodes).text()
      if (text.includes('G5_CLIENT_ID')) {
        let dataLayer = text.trim()
        if (dataLayer.includes('dataLayer.push(')) {
          dataLayer = dataLayer.split('dataLayer.push(')[1]
          dataLayer = dataLayer.split(');')[0]
        } else if (dataLayer.includes('dataLayer = ')) {
          dataLayer = dataLayer.split('dataLayer = [')[1]
          dataLayer = dataLayer.split(']')[0]
        }
        dataLayer = JSON.parse(dataLayer)
        siteDataLayer = dataLayer
      }
    })

    return siteDataLayer
  }
}
