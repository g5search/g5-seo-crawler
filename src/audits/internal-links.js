const https = require('https')
const axios = require('axios').create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

module.exports = {
  run,
  getDetails
}

function getDetails () {
  return {
    name: 'Internal Links',
    headers: [],
    description: null,
    displayAs: null,
    type: '_audit'
  }
}

async function run (cheerio, page, url = null, audit) {
  const passingStatuses = [
    302,
    200
  ]
  const { name } = getDetails()
  const rootDomainLength = audit.rootDomain.length
  const rootDomain = audit.rootDomain.substring(0, rootDomainLength)
  const $ = cheerio.load(page)
  const pass = []
  const fail = []
  const links = $('a:not(".number")').not($('.navigation-container a, .corporate-navigation a')).toArray()
  const linkChecks = []

  for (let i = 0; i < links.length; i++) {
    const anchor = links[i]
    if (
      anchor.attribs &&
      anchor.attribs.href &&
      !anchor.attribs.href.includes('tel:') &&
      !anchor.attribs.href.includes('#')
    ) {
      let link = anchor.attribs.href
      if (link[0] === '/') {
        link = `${rootDomain}${link}`
        linkChecks.push(get_anchor_status(anchor, link, $))
      } else if (link.substring(0, rootDomainLength) === rootDomain && !link.includes(audit.locationURN)) {
        linkChecks.push(get_anchor_status(anchor, link, $))
      }
    }
  }

  const checks = await Promise.all(linkChecks)

  checks.forEach((check) => {
    if (passingStatuses.includes(check.status)) {
      pass.push(check)
    } else {
      fail.push(check)
    }
  })

  return { name, pass, fail }
}

async function get_anchor_status (anchor, link, $) {
  const text = $(anchor).text().replace(/\s\s+/g, ' ').trim()
  const linkcheck = await axios
    .get(link, { maxRedirects: 0 })
    .catch(error => error.response)
  const { status } = linkcheck
  let reason = ''

  if (status === 301) {
    reason = 'Internal Redirect'
  } else if (String(status).charAt(0) === '4' || String(status).charAt(0) === '5') {
    reason = 'Broken Link'
  }

  return {
    status,
    link,
    text,
    reason
  }
}
