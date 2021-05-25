const axios = require('axios')
const { getAuthToken } = require('./hub')

module.exports = {
  getClw,
  getCmsUrl,
  getWebsites,
  getSitemapUrl
}

async function getSitemapUrl (locationUrn, clientUrn, domain) {
  const cmsUrl = getCmsUrl(clientUrn)
  const token = getAuthToken()
  const url = `${cmsUrl}/websites?access_token=${token.access_token}`
  const websites = await getWebsites(url)
  const clw = getClw(locationUrn, websites.websites)
  return `${domain}/${clw}-sitemap.xml`
}

function getClw (locationUrn, websites) {
  const clw = websites
    .filter(w => w.location_urn === locationUrn)
    .filter(w => w.is_production)
  
  return clw[0].urn
}

function getWebsites (url) {
  return axios.get(url).then(res => res.data)
}

function getCmsUrl (urn) {
  return `${process.env.CMS_URL}/api/clients/${urn}`
}
