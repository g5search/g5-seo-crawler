module.exports = {
  run,
  getDetails
}

function getDetails () {
  return {
    name: 'H1',
    headers: [],
    description: null,
    displayAs: null,
    type: 'afterAudit'
  }
}

function run (audit) {
  const { name } = getDetails()
  const metadata = []

  Object
    .keys(audit.metadata)
    .forEach((url) => {
      metadata.push({ url, h1: audit.metadata[url].h1 })
    })
  
  const { pass, fail } = score(metadata)

  return { name, pass, fail }
}

function score (metadata) {
  const pass = {}, fail = {}

  metadata.forEach((page, i) => {
    const { h1, url } = page
    let passing = true
    let reason = ''

    if (h1 === null) {
      reason = compare(reason, 'Missing')
      passing = false
      fail[url] = [{ h1: '', reason }]
    } else {
      if (h1.length > 1) {
        reason = compare(reason, 'Multiple')
        passing = false
        fail[url] = []
        h1.forEach(h => fail[url].push({ h1: h, reason }))
      }

      for (let j = 0; j < h1.length; j++) {
        const h = h1[j]
        for (let k = i + 1; k < metadata.length; k++) {
          if (Object.prototype.hasOwnProperty.call(fail, metadata[k].url)) {
            passing = false
          }
          if (
            passing &&
            metadata[k].h1 !== null &&
            metadata[k].h1.includes(h)
          ) {
            reason = compare(reason, 'Duplicate')
            fail[url] = [{ h1: h, reason }]
            fail[metadata[k].url] = [{ h1: metadata[k].url, reason }]
          }
        }
      }
    }

    if (passing) {
      pass[url] = [{ h1: h1[0], reason }]
    }
  })

  return { pass, fail }
}

function compare (current, update) {
  if (current === '') {
    return update
  } else if (current === 'Duplicate' && update === 'Duplicate') {
    return current
  }

  return `${current}, ${update}`
}
