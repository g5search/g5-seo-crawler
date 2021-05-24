module.exports = (obj, keys) => {
  const vkeys = Object
    .keys(obj)
    .filter(k => !keys.includes(k))
  
  return pick(obj, vkeys)
}

function pick (obj, keys) {
  return keys
    .map(k => k in obj ? { [k]: obj[k] } : {})
    .reduce((res, o) => Object.assign(res, o), {})
}
