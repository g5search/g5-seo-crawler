const logger = require('./logger')

const startFunctionLog = (funcName) => logger.info(`"${funcName}" started!`)
const successfullyFunctionLog = (funcName) => logger.info(`"${funcName}" executed successfully!`)

const createErrorWithMessage = (funcName, message) => {
  const error = new Error(message)

  error.isLoggerError = true
  error.functionName = funcName

  return error
}

const onLoggerFunctionError = (error, funcName) => {
  const { functionName } = error
  const message = `"${funcName}" threw an error due to "${functionName}". (Check "${functionName}" error for more info)`

  logger.error(message)
  throw createErrorWithMessage(funcName, message)
}

const onFunctionError = (error, funcName, params) => {
  const message = `"${funcName}" threw an error! (Error message: ${error.message})`

  logger.error(message, { error, params })
  throw createErrorWithMessage(funcName, message)
}

const onError = (error, funcName, params) => {
  if (error.isLoggerError) {
    onLoggerFunctionError(error, funcName)
  } else {
    onFunctionError(error, funcName, params)
  }
}

const loggerFuncWrapper = (funcName, func) => (...args) => {
  startFunctionLog(funcName)

  try {
    const result = func(...args)

    successfullyFunctionLog(funcName)

    return result
  } catch (error) {
    onError(error, funcName, args)
  }
}

const loggerFuncWrapperAsync = (funcName, func) => async (...args) => {
  startFunctionLog(funcName)

  try {
    const result = await func(...args)

    successfullyFunctionLog(funcName)

    return result
  } catch (error) {
    onError(error, funcName, args)
  }
}

module.exports = {
  loggerFuncWrapper,
  loggerFuncWrapperAsync,
}
