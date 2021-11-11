const axios = require('axios')

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
function getAuthToken () {
  return oAuth2.getToken()
}

async function getLocation (clientUrn, locationUrn) {
  const { token } = await getAuthToken()
  const url = `${HUB_URL}/clients/${clientUrn}/locations/${locationUrn}.json?access_token=${token.access_token}`
  const location = await axios.get(url).then(res => res.data)
  return location
}

async function getClient (clientUrn) {
  const { token } = await getAuthToken()
  const url = `${HUB_URL}/clients/${clientUrn}.json?access_token=${token.access_token}`
  const client = await axios.get(url)
    .then(res => res.data)
    .catch((err) => {
      const msg = `Failed fetching hub client data at getClient: (message: ${err.message})`
      throw new Error(msg)
    })
  return client
}

function validLocation (location) {
  return location && location.home_page_url && location.status === 'Live'
}

function getLocationHomePageUrl (locations, clientUrn, locationUrn) {
  const matchingLocation = locations.find(location => location.urn === locationUrn)
  const locationIsValid = validLocation(matchingLocation)
  if (!locationIsValid) {
    const msg = `Location is invalid for auditing, must be Live and have a homepageurl
    (Hub Link: ${HUB_URL}/admin/clients/${clientUrn}/locations/${locationUrn})`
    throw new Error(msg)
  }
  return matchingLocation.home_page_url
}

async function getSitemapType (locationUrn, clientUrn) {
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
}
