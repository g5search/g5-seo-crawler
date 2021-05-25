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
    name: 'Navigation',
    headers: [],
    description: null,
    displayAs: null,
    type: '_afterAudit'
  }
}

async function run (audit) {
  const { rootDomain } = audit
  const passingStatuses = [
    200
  ]
  const pass = {
    'All Pages': []
  }
  const fail = {
    'All Pages': []
  }
  const { name } = getDetails()
  let links = []
  Object.keys(audit.metadata).forEach((url) => {
    links = links.concat(audit.metadata[url].nav)
  })
  links = links.filter(l => l)
  const dedupe = links.reduce((unique, o) => {
    if (!unique.some(obj => obj.link === o.link && obj.text === o.text)) {
      unique.push(o)
    }
    return unique
  }, [])

  for (let i = 0; i < dedupe.length; i++) {
    const link = dedupe[i]
    if (link.link[0] === '/') {
      link.link = `${rootDomain}${link.link}`
    }
    const linkCheck = await get_anchor_status(link)
    if (passingStatuses.includes(linkCheck.status)) {
      pass['All Pages'].push(linkCheck)
    } else {
      fail['All Pages'].push(linkCheck)
    }
  }

  return { name, pass, fail }
}

async function get_anchor_status (anchor) {
  const { link, text } = anchor
  const linkcheck = await axios
    .get(link, { maxRedirects: 0 })
    .catch(error => error.response)
  const { status } = linkcheck
  let reason = ''
  if (status === 301) {
    reason = 'Redirect'
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
