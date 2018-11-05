'use strict'

const Koa = require('koa')
require('dotenv').config()
const config = require('config')
const errorHandler = require('./middleware/error-handler')
const cors = require('@koa/cors')
const routes = require('./routes')
const winston = require('winston')

const app = new Koa()

app.use(errorHandler({env: process.env.NODE_ENV, expose: ['development', 'test']}))
app.use(cors({origin: config.get('client.origin')}))
app.use(routes())

const Logger = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
})

const port = process.env.PORT || config.app.port || 8080

const server = app.listen(port, () => {
  Logger.info('Started ' + config.app.name + ' server on port ' + port)
})

module.exports = {
  closeServer() {
    server.close()
  }
}
