module.exports = {
  isSecure,
  root,
  isPath
}

function isSecure (domain) {
  return domain.substring(0, 5) === 'https'
}

function root (domain) {
  return isSecure(domain)
    ? `https://${domain.split('/')[2]}`
    : `http://${domain.split('/')[2]}`
}

function isPath (root) {
  return root.charAt((root.length - 1)) === '/'
}