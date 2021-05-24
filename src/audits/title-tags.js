module.exports = {
  run,
  getDetails
}

function getDetails () {
  return {
    name: 'Title Tags',
    headers: [],
    description: null,
    displayAs: null,
    type: '_afterAudit'
  }
}

async function run (audit) {
  const { name } = getDetails()
  const metadata = []
  Object.keys(audit.metadata).forEach((url) => {
    metaData.push({
      url,
      titleTag: audit.metadata[url].titleTag
    })
  })
  const { pass, fail } = getDuplicates(metadata)
  return {
    name,
    pass,
    fail
  }
}

function getDuplicates (metadata) {
  const pass = {}
  const fail = {}
  metadata.forEach((page, i) => {
    const { titleTag, url } = page
    let passing = true
    const charCount = titleTag.length - 1
    let reason = ''

    for (let ci = i + 1; ci < metadata.length; ci++) {
      if (fail.hasOwnProperty(metadata[ci].url)) {
        reason = checkReason(reason, 'Duplicate')
        passing = false
      }
      if (titleTag === metadata[ci].titleTag && passing) {
        reason = checkReason(reason, 'Duplicate')
        fail[url] = [{ titleTag, charCount, reason }]
        fail[metadata[ci].url] = [{ titleTag, charCount, reason }]
        passing = false
      }
    }

    if (charCount < 5) {
      reason = checkReason(reason, 'Insufficient Characters')
      fail[url] = [{ titleTag, charCount, reason }]
      passing = false
    } else if (charCount > 70) {
      reason = checkReason(reason, 'Excessive Characters')
      fail[url] = [{ titleTag, charCount, reason }]
      passing = false
    }
    if (passing) {
      reason = ''
      pass[url] = [{ titleTag, charCount, reason }]
    }
  })
  return { pass, fail }
}

function checkReason (reason, newReason) {
  if (reason === '') {
    return newReason
  } else if (reason.includes(newReason)) {
    return reason
  }
  return `${reason}, 
  ${newReason}`
}
