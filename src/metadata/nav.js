module.exports = function ($) {
  const links = $('.navigation-container a').toArray()
  const returnData = []
  for (let i = 0; i < links.length; i++) {
    const anchor = links[i]
    if (anchor.attribs && anchor.attribs.href && !anchor.attribs.href.includes('tel:') && !anchor.attribs.href.includes('#')) {
      const link = anchor.attribs.href
      returnData.push({ link, text: $(anchor).text().replace(/\s\s+/g, ' ').trim() })
    }
  }
  return returnData
}
