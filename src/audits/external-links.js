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
    name: 'External Links',
    headers: [],
    description: null,
    displayAs: null,
    type: '_audit'
  }
}

async function run (cheerio, page, url = null, audit) {
  const validStatuses = [302, 200]
  const { name } = getDetails()
  const rootDomainLength = audit.rootDomain.length
  const rootDomain = audit.rootDomain.substring(0, rootDomainLength)
  const $ = cheerio.load(page)
  const pass = [], fail = [], checks = []
  const links = $('a:not(.number)').parent().not('.social-links, .footer-info, .housing-icons, .custom-links-3, .footer-info .nav, .social-feed').toArray()
  
  for (let i = 0; i < links.length; i++) {
    const a = links[i]
    if (
      a.attribs &&
      a.attribs.href &&
      !a.attribs.href.includes('tel:') &&
      !a.attribs.href.includes('#')
    ) {
      const link = a.attribs.href
      if (
        link[0] !== '/' &&
        !link.includes(rootDomain) &&
        link.includes('http')
      ) {
        checks.push(getStatus(a, link, $))
      }
    }
  }

  const checked = await Promise.all(checks)

  checked.forEach((check) => {
    if (validStatuses.includes(check.status)) {
      pass.push(check)
    } else {
      fail.push(check)
    }
  })

  return { name, pass, fail }
} 

async function getStatus (a, link, $) {
  const text = $(a).text().replace(/\s\s+/g, ' ').trim()
  const check = await axios.get(link, { maxRedirects: 0 })
    .catch(err => err.response)
  const { status } = check
  let reason = ''
  
  if (status === 301) {
    reason = 'External Permanent Redirect'
  } else if (
    String(status).charAt(0) === '4' ||
    String(status).charAt(0) === '5'
  ) {
    reason = 'Broken External Link'
  }

  return { status, link, text, reason }
}
