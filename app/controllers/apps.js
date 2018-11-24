'use strict'

const config = require('config')
const elasticsearch = require('../elasticsearch')

module.exports = {
  async list(ctx, next) {
    try {
      const data = await elasticsearch.list('app', config.db)
      ctx.body = data.hits
    }
    catch (error) {
      if (error.response && error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.status = 200
    await next()
  },

  async get(ctx, next) {
    try {
      ctx.body = await elasticsearch.get('app', ctx.params.id, config.db)
    }
    catch (error) {
      if (error.response && error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.status = 200
    await next()
  }
}
