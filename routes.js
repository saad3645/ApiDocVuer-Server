'use strict'

const compose = require('koa-compose')
const Router = require('koa-router')
const koaBody = require('koa-body')
const auth = require('./middleware/authenticator')
const docs = require('./controllers/docs')

const router = new Router()

router
  .post('/login', koaBody(), auth.login)
  .get('/d', auth.authenticate, docs.list)
  .get('/d/:id/openapi', auth.authenticate, docs.get)
  .get('/d/:id/info', auth.authenticate, docs.info)
  .get('/d/:id/collections', auth.authenticate, docs.collections)

module.exports = () => {
  return compose([
    router.routes(),
    router.allowedMethods()
  ])
}
