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
  .get('/apps/:id/docs', auth.verifyJWT('read:app:id'), apps.docs)
  .get('/docs/:id', auth.verifyJWT('read:doc:id'), docs.get)
  .get('/docs/:id/:version', auth.verifyJWT('read:doc:id'), docs.get)

module.exports = () => {
  return compose([
    router.routes(),
    router.allowedMethods()
  ])
}
