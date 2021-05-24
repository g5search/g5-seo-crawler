module.exports = {
  run,
  getDetails
}

function getDetails () {
  return {
    name: 'Alt Text',
    headers: [],
    description: null,
    displayAs: null,
    type: 'audit'
  }
}

function run (cheerio, page) {
  const { name } = getDetails()
  const $ = cheerio.load(page)
  const pass = []
  const fail = []
  const reason = 'Missing Alt Text'
  const images = $('img:not(.divider-image)').toArray()

  images.forEach((img) => {
    if (img.attribs && img.attribs.src) {
      const { src, alt } = img.attribs
      if (!alt) {
        fail.push({ src, alt, reason })
      } else {
        pass.push({ src, alt, reason: '' })
      }
    }
  })

  return { name, pass, fail }
}
