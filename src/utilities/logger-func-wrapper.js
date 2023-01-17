const logger = require('./logger')

const createErrorMessage = (funcName, error) => `"${funcName}" threw an error! (Error message: ${error.message})`

const startFunctionLog = (funcName) => logger.info(`"${funcName}" started!`)
const successfullyFunctionLog = (funcName) => logger.info(`"${funcName}" executed successfully!`)
const errorFunctionLog = (error, message) => logger.error(message, { error })

const loggerFuncWrapper = (funcName, func) => (...args) => {
  startFunctionLog(funcName)

  try {
    const result = func(...args)

    successfullyFunctionLog(funcName)

    return result
  } catch (error) {
    const message = createErrorMessage(funcName, error)

    errorFunctionLog(error, message)
    throw new Error(message)
  }
}

const loggerFuncWrapperAsync = (funcName, func) => async (...args) => {
  startFunctionLog(funcName)

  try {
    const result = await func(...args)

    successfullyFunctionLog(funcName)

    return result
  } catch (error) {
    const message = createErrorMessage(funcName, error)

    errorFunctionLog(error, message)
    throw new Error(message)
  }
}

module.exports = {
  loggerFuncWrapper,
  loggerFuncWrapperAsync,
}
