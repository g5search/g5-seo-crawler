const { convertHtmlEntities } = require('../utilities/string')

module.exports = ($) => {
  const desc = $('meta[name="description"]')[0]

  if (
    desc &&
    desc.attribs &&
    desc.attribs.content
  ) {
    return convertHtmlEntities(desc.attribs.content)
  } else {
    return null
  }
}
