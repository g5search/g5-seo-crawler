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
  const client = await axios.get(url).then(res => res.data)
  return client
}

async function getSitemapType (locationUrn, clientUrn) {
  try {
    const { token } = await getAuthToken()
    const url = `${HUB_URL}/clients/${clientUrn}.json?access_token=${token.access_token}`
    const hubData = await axios.get(url).then(res => res.data)
    const { locations, domain, domain_type, vertical } = hubData.client
    const location = locations.find(l => l.urn === locationUrn)
    if (!location) {
      throw new Error(`Location URN, ${locationUrn}, was not found.`)
    }
    if (location.status === 'Deleted') {
      throw new Error('Location has been deleted.')
    }
    const { home_page_url } = locations.filter(location => location.urn === locationUrn)[0]
    let rootDomain = home_page_url
  
    if (domain_type === 'SingleDomainClient') {
      rootDomain = domain
    }
  
    return {
      domain_type,
      rootDomain,
      vertical,
      home_page_url
    }
  } catch (error) {
    throw error
  }
}
