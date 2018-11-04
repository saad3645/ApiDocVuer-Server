'use strict'

const config = require('config')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const nanoid = require('nanoid')
const bcrypt = require('bcryptjs')
const ms = require('ms')

const AUTHORIZATION_REGEX = /^(Bearer +([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+))$/
const SCOPE_REGEX = /^(?:((read|write)\:([a-z._-]+))(?:\:([a-zA-Z0-9_-]+)(?:\:([a-zA-Z0-9_-]+))?)?)$/

const generateToken = function(username, acl, options) {
  const nonce = nanoid(options.nonceLength)
  return jwt.sign({user: username, scope: acl, nonce: nonce}, options.secret, {algorithm: options.algorithm})
}

const checkScope = function(payloadScope, ctxScope) {
  if (typeof payloadScope === 'string') {
    return (payloadScope === 'superuser')
  }
  else if (Array.isArray(payloadScope)) {
    const ctxScopeMatch = ctxScope.match(SCOPE_REGEX)
    if (ctxScopeMatch) {
      if (ctxScopeMatch[4] && ctxScopeMatch[5]) {
        return payloadScope.some(scope => {
          const scopeMatch = scope.match(SCOPE_REGEX)
          return (scopeMatch && scopeMatch[4] && scopeMatch[5] && scopeMatch[1] === ctxScopeMatch[1] && scopeMatch[4] === ctx.params[ctxScopeMatch[4]] && scopeMatch[5] === ctx.params[ctxScopeMatch[5]])
        })
      }
      else if (ctxScopeMatch[4]) {
        return payloadScope.some(scope => {
          const scopeMatch = scope.match(SCOPE_REGEX)
          return (scopeMatch && scopeMatch[4] && scopeMatch[1] === ctxScopeMatch[1] && scopeMatch[4] === ctx.params[ctxScopeMatch[4]])
        })
      }
      else {
        return payloadScope.some(scope => {
          const scopeMatch = scope.match(SCOPE_REGEX)
          return (scopeMatch && scopeMatch[1] === ctxScopeMatch[1])
        })
      }
    }
    else {
      return payloadScope.some(scope => (scope === ctxScope))
    }
  }

  return false
}

const verifyToken = function(token, ctxScope, options) {
  const payload = jwt.verify(token, options.secret, {algorithms: [options.algorithm], maxAge: options.maxAge})
  if (!checkScope(payload.scope, ctxScope)) {
    throw {name: 'InvalidScope'}
  }
  return payload
}

module.exports = {
  async login(ctx, next) {
    if (!ctx.request.body || JSON.stringify(ctx.request.body) === '{}' || JSON.stringify(ctx.request.body) === '[]') {
      ctx.throw(400, undefined, {errors: [{code: 'BAD_REQUEST', detail: 'Request body is empty or malformed'}], expose: true})
    }

    const errors = []
    if (!ctx.request.body.username) {
      errors.push({code: 'MISSING_PARAMETER', parameter: 'username', detail: 'Username is required'})
    }
    if (!ctx.request.body.password) {
      errors.push({code: 'MISSING_PARAMETER', parameter: 'password', detail: 'Password is required'})
    }
    if (errors.length > 0) {
      ctx.throw(422, undefined, {errors: errors, expose: true})
    }

    const q = {}

    try {
      const url = config.appbase.baseUrl + config.appbase.appname + '/users/' + ctx.request.body.username + '/_source'
      const res = await axios.get(url, {headers: {'Authorization': config.appbase.authorization}})
      if (!res.data || !res.data.password_hash || !bcrypt.compareSync(ctx.request.body.password, res.data.password_hash)) {
        throw {code: 'UNAUTHORIZED'}
      }
      q.acl = (res.data.acl || [])
    }
    catch (error) {
      if (error.code === 'UNAUTHORIZED') {
        ctx.throw(401, undefined, {errors: [{code: 'UNAUTHORIZED', detail: 'Invalid username and password'}], expose: true})
      }
      if (error.response.status === 404) {
        ctx.throw(401, undefined, {errors: [{code: 'UNAUTHORIZED', detail: 'Invalid username and password'}], expose: true})
      }
      else {
        ctx.throw(503, error.message, {log: true})
      }
    }

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
    return async function(ctx, next) {
      if (!ctx.get('Authorization') || ctx.get('Authorization').trim().length === 0) {
        ctx.throw(403)
      }

      const authMatch = ctx.get('Authorization').match(AUTHORIZATION_REGEX)
      if (!authMatch) {
        ctx.throw(401, undefined, {errors: [{code: 'AUTHORIZATION_MALFORMED', detail: 'Authorization header is malformed, make sure you have included `Bearer` before your access token'}], expose: true})
      }
      const token = authMatch[2]

      try {
        const payload = verifyToken(token, ctxScope, config.auth)
        ctx.state.user = payload.user
      }
      catch (error) {
        if (error.name === 'InvalidScopeType' || error.name === 'InvalidScope') {
          ctx.throw(401, undefined, {errors: [{code: 'ACCESS_NOT_ALLOWED', detail: 'You do not have access to this resource/endpoint'}], expose: true})
        }
        if (error.name === 'TokenExpiredError') {
          ctx.throw(401, undefined, {errors: [{code: 'EXPIRED_TOKEN', detail: 'Access token has expired, please login again'}], expose: true})
        }
        else if (error.name === 'JsonWebTokenError') {
          ctx.throw(403)
        }
      }

      await next()
    }
  }
}
