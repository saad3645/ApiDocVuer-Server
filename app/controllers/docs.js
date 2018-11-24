'use strict'

const config = require('config')
const elasticsearch = require('../elasticsearch')

module.exports = {
  async get(ctx, next) {
    try {
      ctx.body = await elasticsearch.get('doc', ctx.params.id, config.db)
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.status = 200
    await next()
  },

  async versions(ctx, next) {
    try {
      const data = await elasticsearch.searchUri('doc', {parent: ctx.params.docId}, config.db)
      ctx.body = data.hits
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.status = 200
    await next()
  },

  async branches(ctx, next) {
    try {
      const data = await elasticsearch.searchUri('doc', {parent: (ctx.params.docId + '.' + ctx.params.version)}, config.db)
      ctx.body = data.hits
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error, {log: true})
      }
    }

    ctx.status = 200
    await next()
  },

  async openapi(ctx, next) {
    try {
      const id = ctx.params.docId + '.' + ctx.params.version + '.' + (ctx.query.branch ? ctx.query.branch : 'master')
      ctx.body = await elasticsearch.get('openapi', id, config.db)
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error.message, {log: true})
      }
    }

    ctx.status = 200
    await next()
  }
}
