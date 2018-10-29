'use strict'

const config = require('config')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const nanoid = require('nanoid')
const ms = require('ms')

const AUTHORIZATION_REGEX = RegExp(/^(Bearer +([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+))$/)

const authOptions = {
  algorithm: config.get('auth.algorithm'),
  maxAge: config.get('auth.maxAge'),
  nonceLength: config.get('auth.nonceLength'),
  secret: process.env.APP_SECRET
}

const binOptions = {
  usersUrl: config.get('jsonbin.baseUrl') + config.get('jsonbin.binUrl') + '/' + config.get('jsonbin.usersBin'),
  secret: process.env.JSONBIN_SECRET
}

const getUser = async function(username, options) {
  const users = await axios.get(options.usersUrl, {headers: {'secret-key': options.secret}})
  return (users.data !== null && typeof users.data === 'object' && !Array.isArray(users.data) && users.data[username] ? users.data[username] : null)
}

const generateToken = function(username, options) {
  const nonce = nanoid(options.nonceLength)
  return jwt.sign({user: username, nonce: nonce}, options.secret, {algorithm: options.algorithm})
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

    const response = {}
    try {
      response.user = await getUser(ctx.request.body.username, binOptions)
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(503, error.message, {log: true})
      }
      else {
        ctx.throw(503, error.message, {log: true})
      }
    }

    if (!response.user || ctx.request.body.password !== response.user.password) {
      ctx.throw(401, undefined, {errors: [{code: 'UNAUTHORIZED', detail: 'Invalid username and password'}], expose: true})
    }

    const token = generateToken(ctx.request.body.username, authOptions)

    ctx.body = {
      status: 'ok',
      token: token,
      ttl: Math.floor(ms(authOptions.maxAge) / 1000)
    }

    ctx.status = 200
    await next()
  },

  async authenticate(ctx, next) {
    if (!ctx.get('Authorization') || ctx.get('Authorization').trim().length === 0) {
      ctx.throw(403, 'FORBIDDEN', {expose: true})
    }

    const authMatch = ctx.get('Authorization').match(AUTHORIZATION_REGEX)
    if (!authMatch) {
      ctx.throw(401, undefined, {errors: [{code: 'AUTHORIZATION_MALFORMED', detail: 'Authorization header is malformed, make sure you have included `Bearer` before your access token'}], expose: true})
    }
    const token = authMatch[2]

    const decodedToken = {}
    try {
      decodedToken.payload = jwt.verify(token, authOptions.secret, {algorithms: [authOptions.algorithm], maxAge: authOptions.maxAge})
    }
    catch (error) {
      if (error.name === 'TokenExpiredError') {
        ctx.throw(401, undefined, {errors: [{code: 'EXPIRED_TOKEN', detail: 'Access token has expired, please login again'}], expose: true})
      }
      else if (error.name === 'JsonWebTokenError') {
        ctx.throw(403, 'FORBIDDEN', {expose: true})
      }
    }

    const response = {}
    try {
      response.user = await getUser(decodedToken.payload.user, binOptions)
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(503, error.message, {log: true})
      }
      else {
        ctx.throw(503, error.message, {log: true})
      }
    }

    if (!response.user) {
      ctx.throw(401, undefined, {errors: [{code: 'UNAUTHORIZED', detail: 'Invalid username and token'}], expose: true})
    }

    ctx.state.user = response.user
    await next()
  }
}
