const axios = require('axios')
const { getAuthToken } = require('./hub')
const { loggerFuncWrapperAsync } = require('./utilities/logger-func-wrapper')

const getClw = (locationUrn, websites) => {
  const clw = websites
    .filter(w => w.location_urn === locationUrn)
    .filter(w => w.is_production)

  return clw[0].urn
}

const getCmsUrl = (urn) => {
  return `${process.env.CMS_URL}/api/clients/${urn}`
}

const createGetWebsitesUrl = (clientUrn, token) => {
  const cmsUrl = getCmsUrl(clientUrn)

  return `${cmsUrl}/websites?access_token=${token.access_token}`
}

const getWebsites = loggerFuncWrapperAsync('getWebsites', async (clientUrn) => {
  const { token } = await getAuthToken()
  const url = createGetWebsitesUrl(clientUrn, token)
  const { data } = await axios.get(url, {
    headers: { 'Legacy-Auth': 'true' }
  })

  return data
})

const getSitemapUrl = loggerFuncWrapperAsync('getSitemapUrl', async (locationUrn, clientUrn, domain) => {
  const websites = await getWebsites(clientUrn)
  const clw = getClw(locationUrn, websites.websites)

  return `${domain}/${clw}-sitemap.xml`
})

module.exports = {
  getSitemapUrl
}
