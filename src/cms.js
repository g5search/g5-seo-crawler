const axios = require('axios')
const { getAuthToken } = require('./hub')
const { loggerFuncWrapperAsync } = require('./utilities/logger-func-wrapper')

module.exports = {
  getClw,
  getCmsUrl,
  getWebsites,
  getSitemapUrl
}

const getSitemapUrl = loggerFuncWrapperAsync('getSitemapUrl', async (locationUrn, clientUrn, domain) => {
  const websites = await getWebsites(clientUrn)
  const clw = getClw(locationUrn, websites.websites)

  return `${domain}/${clw}-sitemap.xml`
})

const getClw = (locationUrn, websites) => {
  const clw = websites
    .filter(w => w.location_urn === locationUrn)
    .filter(w => w.is_production)

  return clw[0].urn
}

const getWebsites = getSitemapUrl('getWebsites', async (clientUrn) => {
  const { token } = await getAuthToken()
  const url = createGetWebsitesUrl(clientUrn, token)
  const { data } = await axios.get(url)

  return data
})

const getCmsUrl = (urn) => {
  return `${process.env.CMS_URL}/api/clients/${urn}`
}

const createGetWebsitesUrl = (clientUrn, token) => {
  const cmsUrl = getCmsUrl(clientUrn)

  return `${cmsUrl}/websites?access_token=${token.access_token}`
}
