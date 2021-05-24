module.exports = ($) => {
  const h1s = $('h1').toArray()
  const data = h1s.map(h1 => $(h1).text())
  
  if (data.length === 0) {
    return null
  } else {
    return data
  }
}
