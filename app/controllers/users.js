'use strict'

const config = require('config')
const Ajv = require('ajv')
const bcrypt = require('bcryptjs')
const nanoid = require('nanoid')
const elasticsearch = require('../elasticsearch')

const USER_CREATE_SCHEMA = require('../schemas/user/user.create.schema.json')
const USER_CREATE_PASSWORD_SCHEMA = require('../schemas/user/user.create_password.schema.json')

module.exports = {
  async create(ctx, next) {
    const ajv = new Ajv()
    const valid = ajv.validate(USER_CREATE_SCHEMA, ctx.request.body)
    ctx.assert(valid, 422, undefined, {errors: ajv.errors, expose: true})

    const code = nanoid(config.users.registrationCodeLength)
    const data = Object.assign({registration_code: code}, ctx.request.body)

    try {
      await elasticsearch.create('user', ctx.request.body.username, data, config.db)
    }
    catch (error) {
      if (error.response && error.response.status === 409) {
        ctx.throw(409)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.status = 201
    ctx.body = {username: ctx.request.body.username, email: ctx.request.body.email, code: code}
    await next()
  },

  async activatePassword(ctx, next) {
    const ajv = new Ajv()
    const valid = ajv.validate(USER_CREATE_PASSWORD_SCHEMA, ctx.request.body)
    ctx.assert(valid, 422, undefined, {errors: ajv.errors, expose: true})
    // eslint-disable-next-line
    ctx.assert(ctx.request.body.username || ctx.request.body.email, 422, undefined, {errors: [{keyword: 'required', params: {missingProperty: ['username', 'email']}, message: 'should have required parameter \'username\' or \'email\''}], expose: true})
    // eslint-disable-next-line
    ctx.assert(!ctx.request.body.username || !ctx.request.body.email, 422, undefined, {errors: [{keyword: 'exclusiveRequired', params: {exclusiveProperties: ['username', 'email']}, message: 'should have only one of \'username\' or \'email\''}], expose: true})

    const data = {
      password_hash: bcrypt.hashSync(ctx.request.body.password)
    }

    let code = null
    try {
      const res = await elasticsearch.get('user', ctx.request.body.username, config.db)
      code = res.registration_code ? res.registration_code : null
    }
    catch (error) {
      if (error.response && error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.assert(code && code === ctx.request.body.code, 401, undefined)

    try {
      await elasticsearch.update('user', ctx.request.body.username, data, config.db)
    }
    catch (error) {
      if (error.response && error.response.status === 404) {
        ctx.throw(404)
      }
      if (error.response && error.response.status === 409) {
        ctx.throw(409)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.status = 200
    await next()
  }
}
