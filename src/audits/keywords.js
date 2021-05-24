const CheckKeywords = require('../keywords')
const reject = require('../utilities/reject')

module.exports = {
  run,
  getDetails
}

function getDetails () {
  return {
    name: 'Keywords',
    headers: [],
    description: null,
    displayAs: 'table',
    type: '_afterAudit'
  }
}

function run (audit) {
  const { name } = getDetails()
  const pass = {}
  const fail = {}
  const keywordChecker = new CheckKeywords(audit)
  const urls = keywordChecker.allURLs
  urls.forEach((url) => {
    const passArr = []
    const failArr = []
    const pageObj = keywordChecker.checkKeywords(url)
    if (pageObj) {
      Object.keys(pageObj).forEach((type) => {
        if (pageObj[type].passing) {
          passArr.push(reject(pageObj[type], ['passing', 'pageName']))
        } else {
          failArr.push(reject(pageObj[type], ['passing', 'pageName']))
        }
      })
      pass[url] = passArr
      fail[url] = failArr
    }
  })

  return { name, pass, fail }
}
