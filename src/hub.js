const axios = require('axios')
const { loggerFuncWrapperAsync } = require('./utilities/logger-func-wrapper')

const {
  G5_AUTH_CLIENT_ID,
  G5_AUTH_CLIENT_SECRET,
  TOKEN_HOST,
  HUB_URL
} = process.env

const credentials = {
  client: {
    id: G5_AUTH_CLIENT_ID,
    secret: G5_AUTH_CLIENT_SECRET
  },
  auth: {
    tokenHost: TOKEN_HOST
  }
}
const { ClientCredentials } = require('simple-oauth2')
const oAuth2 = new ClientCredentials(credentials)

module.exports = {
  getLocation,
  getClient,
  getSitemapType,
  getAuthToken
}

/**
 * Get bearer token for CMS endpoints
 * @returns token and expiration
 */
const getAuthToken = loggerFuncWrapperAsync('getAuthToken', () => {
  return oAuth2.getToken()
})

const getLocation = loggerFuncWrapperAsync('getLocation', async (clientUrn, locationUrn) => {
  const { token } = await getAuthToken()
  const url = `${HUB_URL}/clients/${clientUrn}/locations/${locationUrn}.json?access_token=${token.access_token}`
  const location = await axios.get(url).then(res => res.data)
  return location
})

const getClient = loggerFuncWrapperAsync('getClient', async (clientUrn) => {
  const { token } = await getAuthToken()
  const url = `${HUB_URL}/clients/${clientUrn}.json?access_token=${token.access_token}`
  const client = await axios.get(url)
    .then(res => res.data)
    .catch((err) => {
      const msg = `Failed fetching hub client data at getClient: (message: ${err.message})`
      throw new Error(msg)
    })
  return client
})

const validLocation = (location) => {
  return location && location.home_page_url && location.status === 'Live'
}

const getLocationHomePageUrl = (locations, clientUrn, locationUrn) => {
  const matchingLocation = locations.find(location => location.urn === locationUrn)
  const locationIsValid = validLocation(matchingLocation)
  if (!locationIsValid) {
    const msg = `Location is invalid for auditing, must be Live and have a homepageurl
    (Hub Link: ${HUB_URL}/admin/clients/${clientUrn}/locations/${locationUrn})`
    throw new Error(msg)
  }
  return matchingLocation.home_page_url
}

const getSitemapType = loggerFuncWrapperAsync('getSitemapType', async (locationUrn, clientUrn) => {
  const { client } = await getClient(clientUrn)
  const { locations, domain, domain_type, vertical } = client
  const home_page_url = getLocationHomePageUrl(locations, clientUrn, locationUrn)
  const rootDomain = domain_type === 'SingleDomainClient'
    ? domain : home_page_url

  return {
    domain_type,
    rootDomain,
    vertical,
    home_page_url
  }
})
