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
    name: 'Social / Footer Links',
    headers: [],
    description: null,
    displayAs: null,
    type: '_afterAudit'
  }
}

async function run (audit) {
  const passingStatuses = [
    302,
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
    links = links.concat(audit.metadata[url]['social-links'])
  })

  links = links.filter(l => l)
  const dedupe = links.reduce((unique, o) => {
    if (!unique.some(obj => obj.link === o.link && obj.text === o.text && obj.class === o.class)) {
      unique.push(o)
    }
    return unique
  }, [])
  for (let i = 0; i < dedupe.length; i++) {
    if (!dedupe[i].link.includes('linkedin.com')) {
      const linkCheck = await getAnchorStatus(dedupe[i])
      if (passingStatuses.includes(linkCheck.status)) {
        pass['All Pages'].push(linkCheck)
      } else {
        fail['All Pages'].push(linkCheck)
      }
    }
  }
  return {
    name,
    pass,
    fail
  }
}

async function getAnchorStatus (anchor) {
  const { link, text, className } = anchor
  const { status } = await axios
    .get(link, { maxRedirects: 7 })
    .catch(error => error.response)
  let reason = ''
  if (status === 301) {
    reason = 'Off-Page Link Redirect'
  } else if (String(status).charAt(0) === '4' || String(status).charAt(0) === '5') {
    reason = 'Broken Off-Page Link'
  }
  return {
    status,
    link,
    text,
    reason,
    className
  }
}
