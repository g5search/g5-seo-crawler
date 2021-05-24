module.exports = {
  convertHtmlEntities (str) {
    const conversions = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '$apos;': "'"
    }

    return str.replace(/(&lt;)|(&amp;)|(&gt;)|(&quot;)|($apos;)/g, find => conversions[find])
  }
}
