const { convertHtmlEntities } = require('../utilities/string')

module.exports = function ($) {
  const titleTags = $('title').toArray()
  const returnData = titleTags.map(titleTag => $(titleTag).text())
  return convertHtmlEntities(returnData[0])
}
