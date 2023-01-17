const { createLogger, format, transports } = require('winston')

const consoleInfoTransport = new transports.Console({
  level: 'info',
  handleExceptions: true
})

const consoleErrorTransport = new transports.Console({
  level: 'error',
  handleExceptions: true
})

const loggerTransports = [
  consoleInfoTransport,
  consoleErrorTransport
]

const logger = createLogger({
  defaultMeta: { service: 'G5 SEO Crawler' },
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: loggerTransports
})

module.exports = logger
