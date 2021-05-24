module.exports = function ($) {
  const links = $('.footer-info a, .social-links a').toArray()
  const returnData = []
  for (let i = 0; i < links.length; i++) {
    const anchor = links[i]
    if (anchor.attribs && anchor.attribs.href && !anchor.attribs.href.includes('tel:') && !anchor.attribs.href.includes('#')) {
      const link = anchor.attribs.href
      if (link[0] !== '/' && link.includes('http')) {
        returnData.push({ link: anchor.attribs.href, className: anchor.attribs.class, text: $(anchor).text().replace(/\s\s+/g, ' ').trim() })
      }
    }
  }
  return returnData
}
