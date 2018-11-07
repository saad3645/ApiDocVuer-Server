'use strict'

const compose = require('koa-compose')
const Router = require('koa-router')
const koaBody = require('koa-body')
const auth = require('./middleware/authenticator')
const apps = require('./controllers/apps')
const docs = require('./controllers/docs')

const router = new Router()

router
  .post('/login', koaBody(), auth.login)
  .get('/apps', auth.verifyJWT('read:apps'), apps.list)
  .get('/apps/:id', auth.verifyJWT('read:app:id'), apps.get)
  .get('/apps/:id/docs', auth.verifyJWT('read:app.docs:id'), apps.docs)
  .get('/docs/openapi/:appId/:docId/:version', auth.verifyJWT('read:doc:appId:docId'), docs.getOpenApi)

module.exports = () => {
  return compose([
    router.routes(),
    router.allowedMethods()
  ])
}
