const https = require('https')
const cheerio = require('cheerio')
const axios = require('axios').create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

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
    this._singleDomain = params.singleDomain
    this._corporate = params.corporate
    this._clientUrn = params.clientUrn
    this._locationUrn = params.locationUrn
    this._sitemapUrl = params.sitemapUrl
    this._vertical = null
    this._locationName = null
    this._discoverLinks = params.discoverLinks || true
  }

  get pages () { return this._pages }

  set crawled (url) { this._crawled.push(url) }
  get crawled () { return this._crawled }

  get homepage () { return this._homepage }

  set rootDomain (domain) { this._rootDomain = domain }
  get rootDomain () { return this._rootDomain }

  get errors () { return this._errors }
  get externalLinks () { return this._externalLinks }
  get singleDomain () { return this._singleDomain }
  get corporate () { return this._corporate }
  get clientUrn () { return this._clientUrn }
  get locationUrn () { return this._locationUrn }
  get sitemapUrl () { return this._sitemapUrl }
  get vertical () { return this._vertical }
  get locationName () { return this._locationName }
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
    const anchors = $('a:not(".number")').toArray()

    anchors.forEach((a) => {
      /**
       * Formalize links and reject links with no content
       */
      if (
        a.attribs &&
        a.attribs.href &&
        !a.attribs.href.includes('tel:') &&
        !a.attribs.href.includes('mailto:') &&
        !a.attribs.href.includes('#') &&
        !a.attribs.href.includes('.jpg')
      ) {
        let link = a.attribs.href
        if (link.charAt(0) === '/') {
          link = `${this._rootDomain}${link}`
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
            if (this._corporate) {
              const directoryCount = link.split('/')
              if (directoryCount.length < 5) {
                this._pages.push(link)
              }
            } else {
              this._pages.push(link)
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
  }

  nextPage () {
    return this._pages.pop()
  }

  getDataLayer (page) {
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
