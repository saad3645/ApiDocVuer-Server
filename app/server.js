'use strict'

require('dotenv').config()
const config = require('config')
const winston = require('winston')
const app = require('./index')

const Logger = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
})

const port = process.env.PORT || config.app.port || 3000

const server = app.listen(port, () => {
  Logger.info('Started ' + config.app.name + ' server on port ' + port)
})

module.exports = server
