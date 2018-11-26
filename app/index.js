'use strict'

const Koa = require('koa')
require('dotenv').config()
const config = require('config')
const errorHandler = require('./middleware/error-handler')
const cors = require('@koa/cors')
const routes = require('./routes')

const app = new Koa()

app.use(errorHandler({env: process.env.NODE_ENV, expose: ['development', 'test']}))
app.use(cors({origin: config.get('client.origin')}))
app.use(routes())

module.exports = app
