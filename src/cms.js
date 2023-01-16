const axios = require('axios')
const { getAuthToken } = require('./hub')

module.exports = {
  getClw,
  getCmsUrl,
  getWebsites,
  getSitemapUrl
}

async function getSitemapUrl (locationUrn, clientUrn, domain) {
  const websites = await getWebsites(clientUrn)
  const clw = getClw(locationUrn, websites.websites)

  return `${domain}/${clw}-sitemap.xml`
}

function getClw (locationUrn, websites) {
  const clw = websites
    .filter(w => w.location_urn === locationUrn)
    .filter(w => w.is_production)

  return clw[0].urn
}

async function getWebsites (clientUrn) {
  const { token } = await getAuthToken()
  const url = createGetWebsitesUrl(clientUrn, token)

  try {
    const { data } = await axios.get(url)

    return data
  } catch (error) {
    const msg = `Failed fetching CMS websites data at getWebsites: (message: ${error.message})`

    throw new Error(msg)
  }
}

function getCmsUrl (urn) {
  return `${process.env.CMS_URL}/api/clients/${urn}`
}

function createGetWebsitesUrl (clientUrn, token) {
  const cmsUrl = getCmsUrl(clientUrn)

  return `${cmsUrl}/websites?access_token=${token.access_token}`
}
