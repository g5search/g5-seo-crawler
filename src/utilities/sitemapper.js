const Sitemapper = require('sitemapper')
const sitemapper = new Sitemapper

module.exports = (sitemapUrl) => {
  return sitemapper.fetch(sitemapUrl)
}
