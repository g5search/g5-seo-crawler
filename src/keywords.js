const hubPropAndLiquid = require('./config/hub-prop-and-liquid')
const primaryOfferings = require('./config/primary-offerings')
const standardPageNames = require('./config/standard-page-names')
const standardServices = require('./config/standard-services')

/**
 *This class is responsible for counting various keywords on each page of a website.
 *The types of keywords it checks for are location name, city, state, page name,
 *relevant hub values per vertical, services, and primary offerings (Ex: Apartments, Townhomes, etc)
 * @class CheckKeywords
 */
module.exports = class CheckKeywords {
  /**
   * Creates an instance of CheckKeywords. Sets properties for audit, name, home page url, root domain url, vertical, pages to skip, domain strategy () properties that will be used in page keyword searches
   * @constructor
   * @param {Object} audit
   * @memberof CheckKeywords
   */
  constructor(audit) {
    this.audit = audit
    this.name = audit.hub.location.name
    this.homePageUrl = audit.hub.location.home_page_url
    this.rootDomain = audit.hub.location.domain
    this.vertical = audit.vertical
    this.pagesToSkip = [
      'contact', 'contact us', 'tour', 'schedule a tour', 'privacy', 'privacy policy',
      'map directions', 'directions', 'apply now', 'apply', 'request infomation', ''
    ]
    this.wordsToIgnore = ['a', 'the', 'in', 'on', 'at', 'as', 'new']
    this.domainStrat = this.homePageUrl === this.rootDomain ? 'multi' : 'single'
    this.auditpagename = ''
    this.url = ''
    this.allpageNames = this.getAllPageNames()
    this.allURLs = this.getAllURLs()
  }

  /**
   * Takes a url and formats the slug into a page name
   * @param {string} str url to be formatted into page name
   * @returns {string} page slug without the '-'
   * @memberof CheckKeywords
   */
  getPageName (str) {
    return str === this.homePageUrl ? 'home' : str.split('/').pop().replace(/\-/g, ' ').toLowerCase()
  }

  /**
   *Takes each url on the website and returns array of location internal page names 
   * @returns {[]} Array of page names, returns blank array if no results found
   * @memberof CheckKeywords
   */
  getAllPageNames () {
    let pageNameArr = []
    Object.keys(this.audit.results).forEach((url) => {
      if (!(this.domainStrat === 'single' && url === this.rootDomain)) {
        pageNameArr.push(this.getPageName(url))
      }
    })
    return pageNameArr
  }

  getAllURLs () {
    return Object.keys(this.audit.results).filter((url) => {
      return !(this.domainStrat === 'single' && url === this.rootDomain)
    })
  }

  /**
   * This Method builds a object holding keywords for name city and state that will be used to 
   * check their property values against on page copy
   * @returns {Object} Returns object with city, state, and name properties each holding
   * and object with keyword, liquid, numberofinstances, passing, and type properties
   * @memberof CheckKeywords
   */
  getNameCityStateValues () {
    const ncs = ['name', 'city', 'state']
    return this.buildValueWithLiquidObj(ncs)
  }

  /**
   * This method adds values to a standard key set from its parameters
   * @param {string} keyword A keyword to search on page copy for
   * @param {string} type The type of keyword
   * @param {string} liquid The liquid variable for the keyword
   * @returns {Object} returns object with keyword{string}, liquid{string}, numberofinstances{Number}, passing{boolean}, and type{string}
   * @memberof CheckKeywords
   */
  buildKeywordObj (keyword, type, liquid) {
    return {
      'keywordType': type,
      keyword,
      liquid,
      'reason': undefined,
      'passing': undefined,
      'titleTag': this.audit.metaData[this.url].titleTag,
      'pageName': this.auditpagename
    }
  }

  /**
   * This method is used to generate an object holding all service keywords for a website
   * A pages services are defined by matching the page name against potential services per vertical as well the care levels for senior living
   * in the client hub. The pages that need keywords are defined by a boolean property in the standardPageNames file located in the config folder
   * @returns {Object} Object properties are dynamically named 'servicePages1', 'servicePages2', etc based on how many service are available
   * Within each returned object holds and object with the properties keyword, liquid, numberofinstances, passing, and type.
   * returns null if vertical is apartments or no services are found
   * @memberof CheckKeywords
   */
  getServices () {
    let servicePages = null
    if (this.vertical !== 'Apartments') {
      const hub = this.audit.hub.location
      const allServicesbyVertical = standardServices[this.vertical].services.pageNames
      const hubservices = standardServices[this.vertical].services.hubkeywords.filter((key) => hub[key] !== "").map(key => hub[key].toLowerCase())
      let services = this.allpageNames.filter(service => allServicesbyVertical.indexOf(service) != -1)
      //combines hub keywords arr and services arr, removes duplicates
      services = hubservices.length > 0 ?
        services.concat(hubservices).filter((key, index, arr) => arr.indexOf(key) === index) : services
      if (services.length > 0) {
        servicePages = {}
        services.forEach((service, i) => {
          servicePages[`service${i + 1}`] = this.buildKeywordObj(service, 'Service', 'N/A')
        })
      }
    }
    return servicePages
  }

  /**
   * This method is used in the to generate an object holding all primary offering keywords for a website
   * Primary offering keywords are defined per vertical in the global primaryOfferings Object.
   * @returns {Object}  Object properties are dynamically named 'primaryoffering1', 'primaryoffering2', etc based on how many primary offerings are available
   * Within each returned object holds a object with the properties keyword, liquid, numberofinstances, passing, and type.
   * returns null if no primary offerings found
   * @memberof CheckKeywords
   */
  getPrimaryOfferings () {
    const primoff = {}
    const primOffByVertical = primaryOfferings[this.vertical]
    const titletagArry = Object.keys(this.audit.metaData).map((url) => {
      return this.audit.metaData[url].titleTag.trim()
    })
    const checkforDuplicates = []
    titletagArry.forEach((tt) => {
      primOffByVertical.forEach((e, i) => {
        if (tt.indexOf(e) !== -1 && checkforDuplicates.indexOf(e) === -1) {
          checkforDuplicates.push(e)
          primoff[`primaryoffering${i + 1}`] = this.buildKeywordObj(e, 'Primary Offering', 'N/A')
        }
      })
    })
    return Object.keys(primoff).length === 0 ? null : primoff
  }

  /**
   * checks page name against static list of pages we are not checking
   * @returns {Boolean} Returns true if the page should be ignored, false if page should not be ignored
   * @memberof CheckKeywords
   */
  ignorePage () {
    return this.pagesToSkip.indexOf(this.auditpagename) !== -1
  }

  /**
   * Mutates the class property 'auditpagename' to the name of the current page
   * @param {String} url
   * @memberof CheckKeywords
   */
  setPageNameProperty (url) {
    this.auditpagename = url === this.homePageUrl ? 'home' : this.getPageName(url)
  }

  /**
   * This Method builds a object with the property 'pagename' used to look for the page name keyword in copy
   * @returns {Object} Returns object with a 'pagename' property holding
   * a object with keyword, liquid, numberofinstances, passing, and type properties. Returns null if home page
   * @memberof CheckKeywords
   */
  getPageNameObj () {
    return this.auditpagename === 'home' || this.auditpagename === null ? null :
      { 'pagename': this.buildKeywordObj(this.auditpagename, 'Page Name', 'N/A') }
  }

  /**
   * Finds and returns key in standardPageNames global oject used to access properties
   * Within that key ()
   * @returns {String} key matching current page within the standardPageNames global oject
   * Returns null if no page key found
   * @memberof CheckKeywords
   */
  getCurrentPageKey () {
    const pageKeys = Object.keys(standardPageNames[this.vertical])
    let result = null
    for (let i = 0; i < pageKeys.length; i++) {
      const pageNameArry = standardPageNames[this.vertical][pageKeys[i]].pageNames
      if (pageNameArry.indexOf(this.auditpagename) !== -1) {
        result = pageKeys[i]
        break
      }
    }
    return result
  }

  /**
   * Method looks at a page and determines if it needs a list of service level keywords checked
   * @returns {Boolean} True if page needs a list of service level keywords checked
   * @memberof CheckKeywords
   */
  needsServiceKeywords () {
    //apartments dont use service pages
    const pageKey = this.getCurrentPageKey()
    let result = false
    if (this.vertical !== 'Apartments' && pageKey) {
      result = standardPageNames[this.vertical][pageKey].needsservices
    }
    return result
  }

  /**
   * Method determines what hub properties should be searched for 
   * based on what page is in the auditpagename field
   * @returns {[]} Returns array list of hub properties
   * @memberof CheckKeywords
   */
  getHubProperties () {
    const pageKey = this.getCurrentPageKey()
    return pageKey ? standardPageNames[this.vertical][pageKey].hubkeywords : null
  }

  //returns object holding hub values if possible
  //returns null if no properties

  /**
   * This method generates an object for each hub property holding the keyword, liquid,
   * numberofinstances, passing, and type properties based on vertical
   * @returns {Object} Returns object hub properties each holding 
   * a object with keyword, liquid, numberofinstances, passing, and type properties
   * @memberof CheckKeywords
   */
  getCustomHubValues () {
    const hubProperties = this.getHubProperties()
    return hubProperties ? this.buildValueWithLiquidObj(hubProperties) : null
  }

  /**
   * buildsand returns a object with value and liquid value properties if available
   * returns null if object is empty
   * @param {[]} array list of hub properties
   * @returns {Object}  Returns object hub properties each holding 
   * a object with keyword, liquid, numberofinstances, passing, and type properties
   * @memberof CheckKeywords
   */
  buildValueWithLiquidObj (arry) {
    const hubObj = this.audit.hub.location
    const resultObj = {}
    arry.forEach((e) => {
      if (hubObj[e]) {
        let type = e.replace(/\_|[0-9]/g, ' ').replace(/\s\s+/g, ' ').toProperCase().trim()
        resultObj[e] = this.buildKeywordObj(hubObj[e], type, hubPropAndLiquid[e])
      }
    })
    return Object.keys(resultObj).length > 0 ? resultObj : null
  }

  //

  /**
   * @param {String} url
   * @returns {Object} Returns object holding properties for each type of keyword page check. Each type holds a object with
   * properties for keyword, liquid, numberofinstances, passing, and type filled with corresponding results. Passing and number of 
   * instances properties will be undefined at return. Returns null if the page is designated to be ignored
   * @memberof CheckKeywords
   */
  buildKeywordObjectForChecks (url) {
    this.setPageNameProperty(url)
    this['url'] = url
    let keywordObj = null
    if (!this.ignorePage() && this.auditpagename) {
      keywordObj = {}
      const arryOfObj = [
        this.getNameCityStateValues(),
        this.getCustomHubValues(),
        this.getPageNameObj(),
        this.needsServiceKeywords() ? this.getServices() : null,
        this.getPrimaryOfferings()
      ]
      arryOfObj.filter(obj => obj !== null).forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          keywordObj[key] = obj[key]
        })
      })
    }
    return keywordObj
  }


  /**
   * This method builds a regex object to match all instances of a designated word.
   * Will match plural and non plural
   * @param {String} word
   * @returns A non case sensititive global regex object that matches all instances of the parameter word.
   * @memberof CheckKeywords
   */
  getRegexWordMatchObj (word) {
    return word.length > 2 && word.slice(-1) === 's' ?
      new RegExp(`(?:^|\\b)${word}?(?:$|\\b)`, 'gi') :
      new RegExp(`(?:^|\\b)${word}s?(?:$|\\b)`, 'gi')
  }

  /**
   * This method takes a string of digits form (ex: 1, 2  3)
   * and maps them to their corresponding word (one, two three) in an array.
   * @param {String} str
   * @returns {[]} Array of mapped words
   * @memberof CheckKeywords
   */
  digitToString (str) {
    const digitMap = { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', 'Studio': 'studio' }
    const matchMapKeys = new RegExp(Object.keys(digitMap).join("|"), "gi")
    return str.match(matchMapKeys).map(string => digitMap[string])
  }


  /**
   * This method finds all indexes in a string that match a regular expression and
   * returns them in an array
   * @param {Object} regex object
   * @param {String} copy to search for regex match in
   * @returns {[]} Array of indexes matching regex object in copy
   * @memberof CheckKeywords
   */
  getMatchingIndexesInCopy (regex, copy) {
    let current
    const matchingIndexes = []
    while ((current = regex.exec(copy)) != null) {
      matchingIndexes.push(current.index)
    }
    return matchingIndexes
  }

  /**
   * This method takes an array of keywords and searches the copy parameter for them.
   * A match occurs when all keywords in the array occur within 60 characters plus or minus a index match of the 
   * first keyword in the keyword array
   * @param {[String]} keywordArr Array of strings
   * @param {String} pageCopy String to search keywords in
   * @returns The number of times all keywords in the keyword array occur in the copy
   * @memberof CheckKeywords
   */
  checkMultipleKeywords (keywordArr, pageCopy) {
    let total = 0
    let matchingIndexes = []
    const keyMatchRegx = keywordArr.map(keyword => this.getRegexWordMatchObj(keyword))
    if (pageCopy.match(keyMatchRegx[0]) !== null) {
      //returns arrays in arry for each keywords matching indexes
      keyMatchRegx.forEach(regexSearch => matchingIndexes.push(this.getMatchingIndexesInCopy(regexSearch, pageCopy)))
    }
    if (matchingIndexes.length > 0) {
      matchingIndexes[0].forEach((indexofKey) => {
        let count = 1
        matchingIndexes.slice(1).forEach((array, index) => {
          for (let i = 0; i < array.length; i++) {
            if (array[i] >= indexofKey - 60 && array[i] <= indexofKey + 60) {
              count++;
              matchingIndexes[index + 1].splice(i, 1);
              break;
            }
          }
        })
        if (count >= matchingIndexes.length) {
          total++
        }
      })
    }
    return total
  }


  /**
   * This method takes a string and searches for the number of instances it occurs in another string
   * When using numbers it will seach both the digit and word version of the number and return the combined number
   * @param {String} pageCopy copy used to search through for keyword
   * @param {String} keyword used to search for in copy
   * @returns {Number} number of times the string occurs in the copy
   * @memberof CheckKeywords
   * function hasNumbers(t)
   */
  findNumFloorPlans (pageCopy, keyword) {
    let count = 0
    const hasDigits = /\d/.test(keyword)
    if (hasDigits) {
      const floorPlansinDigits = keyword.match(/[0-9]|Studio/gi) //gets array of floor plans by digit with exception of studio
      const floorPlansinWords = this.digitToString(keyword) //gets array of all floor plans by their word
      const bothFloorPlans = [floorPlansinDigits, floorPlansinWords].filter(fp => fp !== null)
      bothFloorPlans.forEach((fp) => {
        count += this.checkMultipleKeywords(fp, pageCopy)
      })
    }
    return count
  }

  /**
   * This method searches for the number of instances a keyword occurs within a page copy
   * If the keyword has multiple words, a match will be considered true if all keywords are found within
   * A 40+ and 40- character range of the first keywords index position on page
   * @param {String} copy On page copy
   * @param {String} keyword to search for in copy
   * @param {String} key keyword type
   * @returns {Number} The number of instances the keyword occurs in the copy
   * @memberof CheckKeywords
   */
  getKeywordCount (copy, keyword, key) {
    let numKeywords = 0
    const keywordArr = keyword.match(/\w+/g).filter(word => this.wordsToIgnore.indexOf(word) === -1)
    if (keywordArr.length > 1 && key !== 'name') {
      numKeywords = key === 'floor_plans' ? this.findNumFloorPlans(copy, keyword) : this.checkMultipleKeywords(keywordArr, copy)
    }
    else {
      const regex = this.getRegexWordMatchObj(keyword)
      numKeywords = copy.match(regex) ? copy.match(regex).length : 0
    }
    return numKeywords
  }

  /**
   * Checks for keywords in object based 
   *
   * @param {String} url 
   * @param {String} copy from the url param
   * @returns {Object} object holding properties for each keyword check. Each property is holding
   * a object with properties for keyword, liquid, numberofinstances, passing, and type filled with corresponding results. 
   * Returns null if the page is designated to be ignored
   * @memberof CheckKeywords
   */
  checkKeywords (url) {
    const keywordObj = this.buildKeywordObjectForChecks(url)
    const copy = this.audit.metaData[url].body
    if (keywordObj) {
      const keys = Object.keys(keywordObj)
      keys.forEach((key) => {
        const value = keywordObj[key].keyword //gets value to look for
        const numKeywords = this.getKeywordCount(copy, value, key)
        keywordObj[key].reason = numKeywords > 0 ? '' : 'Missing'  //sets number of instances property
        keywordObj[key].passing = numKeywords > 0 ? true : false //sets passing property
      })
    }
    return keywordObj
  }
}

/** 
 * Prototype function for the String class that turns a string into proper case
 * @return {String} in proper case
*/
String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}
