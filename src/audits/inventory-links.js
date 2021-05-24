const https = require('https')
const axios = require('axios').create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const inventoryWidgets = [
  {
    name: 'multifamily-iui-cards-v2',
    configVarName: 'EmberAppConfig',
    vertical: 'Apartments'
  },
  {
    name: 'multi-family-iui-cards-v3',
    configVarName: 'EmberAppConfig',
    vertical: 'Apartments'
  },
  {
    name: 'self-storage-filtered',
    configVarName: 'sssEmberAppConfig',
    vertical: 'Self-Storage'
  }
]

module.exports = {
  run,
  getDetails
}

function getDetails () {
  return {
    name: 'Inventory CTAs',
    headers: [],
    description: null,
    displayAs: null,
    type: '_audit'
  }
}

async function run (cheerio, page, url = null, audit) {
  const { name } = getDetails()
  let { vertical } = audit
  const $ = cheerio.load(page)
  let pass = []
  let fail = []

  for (let iw = 0; iw < inventoryWidgets.length; iw++) {
    const widget = inventoryWidgets[iw]
    const widgets = $(`.${widget.name}`).toArray()
    for (let i = 0; i < widgets.length; i++) {
      if (!audit.vertical) {
        vertical = widget.vertical
      }
      const appConfig = parseWidgetConfig(widgets[i], widget.configVarName, $)
      const { locationUrn } = appConfig.APP
      const auditResults = await auditInventory(vertical, locationUrn)
      pass = pass.concat(auditResults.pass)
      fail = fail.concat(auditResults.fail)
    }
  }

  return { name, pass, fail }
}

async function auditInventory (vertical, locationUrn) {
  passingStatuses = [
    200,
    302,
    301
  ]
  const pass = []
  const fail = []
  const url = buildInventoryUrl(vertical, locationUrn)
  const inventory = await axios
    .get(url)
    .catch(error => error.response)

  if (inventory) {
    const { call_to_actions } = inventory.data
    const ctas = call_to_actions.filter(cta => cta.redirect_url !== null)
    const linkChecks = []
    ctas.forEach((cta) => {
      linkChecks.push(get_link_status(cta.name, cta.redirect_url))
    })
    let checks = await Promise.all(linkChecks)
    checks.forEach((check) => {
      if (passingStatuses.includes(check.status)) {
        pass.push(check)
      } else {
        fail.push(check)
      }
    })
  }

  return { pass, fail }
}

function buildInventoryUrl (vertical, locationUrn) {
  if (vertical === 'Apartments') {
    return `${process.env.APARTMENT_INVENTORY_URL}${locationUrn}/floorplans`
  } else if (vertical === 'Self-Storage') {
    return `https://inventory.g5marketingcloud.com/api/v1/units?location_urn=${locationUrn}`
  }
}

async function get_link_status (text, link) {
  const linkcheck = await axios
    .get(link, { maxRedirects: 0 })
    .catch(error => error.response)
  const { status } = linkcheck
  return { status, link, text }
}

function parseWidgetConfig (widget, configVarName, $) {
  let script = $(widget).find('script:not(.config)')[0].childNodes[0].data
  script = script.split(`var ${configVarName} =`)[1]
  script = script.split("var")[0].trim()
  script = script.replace()
  script = script.replace(/'/g, '"');
  script = script.replace(/^\s*([^":]+):/mg, match => `"${match.replace(":", '').trim()}":`)
  return JSON.parse(script)
}
