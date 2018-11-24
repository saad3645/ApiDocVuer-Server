'use strict'

const config = require('config')
const Ajv = require('ajv')
const jwt = require('jsonwebtoken')
const nanoid = require('nanoid')
const bcrypt = require('bcryptjs')
const ms = require('ms')
const elasticsearch = require('../elasticsearch')

const LOGIN_SCHEMA = require('./login.schema.json')
const AUTHORIZATION_REGEX = /^Bearer +([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)$/
const SCOPE_REGEX = /^(read|write):([a-z._-]+)(?::([a-zA-Z0-9_-]+)(?::([a-zA-Z0-9_-]+))?)?$/

const generateToken = function(username, acl, options) {
  const nonce = nanoid(options.nonceLength)
  return jwt.sign({user: username, scope: acl, nonce: nonce}, options.secret, {algorithm: options.algorithm})
}

const checkScope = function(payloadScope, ctx) {
  if (typeof payloadScope === 'string') {
    return (payloadScope === 'superuser')
  }
  else if (Array.isArray(payloadScope)) {
    const ctxScopeMatch = ctx.state.scope.match(SCOPE_REGEX)
    if (ctxScopeMatch) {
      return payloadScope.some(scope => {
        const scopeMatch = scope.match(SCOPE_REGEX)
        // eslint-disable-next-line max-len
        return (scopeMatch && scopeMatch[1] === ctxScopeMatch[1] && scopeMatch[2] === ctxScopeMatch[2] && (!ctxScopeMatch[3] || (scopeMatch[3] && scopeMatch[3] === ctx.params[ctxScopeMatch[3]])) && (!ctxScopeMatch[4] || (scopeMatch[4] && scopeMatch[4] === ctx.params[ctxScopeMatch[4]])))
      })
    }
    else {
      return payloadScope.some(scope => (scope === ctx.state.scope))
    }
  }

  return false
}

const verifyToken = function(token, ctxScope, ctxParams, options) {
  const payload = jwt.verify(token, options.secret, {algorithms: [options.algorithm], maxAge: options.maxAge, clockTolerance: options.clockTolerance})
  if (!checkScope(payload.scope, ctxScope, ctxParams)) {
    throw new Error('scope_invalid')
  }
  return payload
}

module.exports = {
  async login(ctx, next) {
    ctx.assert(ctx.request.body, 400, 'Request body is empty', {error: 'request_body_empty'})
    ctx.assert(!Array.isArray(ctx.request.body), 400, 'Request body must be a json object', {error: 'request_body_malformed'})

    const ajv = new Ajv()
    const valid = ajv.validate(LOGIN_SCHEMA, ctx.request.body)
    ctx.assert(valid, 422, undefined, {errors: ajv.errors, expose: true})

    const q = {}

    try {
      q.data = await elasticsearch.get('user', ctx.request.body.username)
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(401, 'Invalid username and password', {error: 401, expose: true})
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.assert(q.data && q.data.password_hash, 401, 'Invalid username and password', {error: 401, expose: true})

    const passwordValid = bcrypt.compareSync(ctx.request.body.password, q.data.password_hash)
    ctx.assert(passwordValid, 401, 'Invalid username and password', {error: 401, expose: true})

    const token = generateToken(ctx.request.body.username, q.acl, config.auth)

    ctx.body = {
      status: 'ok',
      token: token,
      ttl: Math.floor(ms(config.auth.maxAge) / 1000)
    }

    ctx.status = 200
    await next()
  },

  verifyJWT(ctxScope) {
    return async (ctx, next) => {
      // eslint-disable-next-line max-len
      ctx.assert(ctx.get('Authorization') && ctx.get('Authorization').trim().length === 0, 401, 'Authorization header is missing or empty', {error: 'authorization_missing', expose: true})

      const authMatch = ctx.get('Authorization').trim().match(AUTHORIZATION_REGEX)
      // eslint-disable-next-line max-len
      ctx.assert(authMatch, 401, 'Authorization header is malformed, make sure you included `Bearer` before your access token', {error: 'authorization_malformed', expose: true})

      const token = authMatch[1]

      try {
        const payload = verifyToken(token, ctxScope, ctx.params, config.auth)
        ctx.state.user = payload.user
      }
      catch (error) {
        if (error.message === 'scope_invalid') {
          ctx.throw(401, 'User does not have access to this resource/endpoint', {error: 'acess_scope_mismatch', expose: true})
        }
        if (error.name === 'TokenExpiredError') {
          ctx.throw(401, 'Access token has expired, please login again', {error: 'access_token_expired', expose: true})
        }
        else if (error.name === 'JsonWebTokenError') {
          ctx.throw(403)
        }
      }

      await next()
    }
  }
}
