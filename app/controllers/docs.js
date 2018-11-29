'use strict'

const config = require('config')
const elasticsearch = require('../elasticsearch')

const buildOpenApi = function(doc) {
  const paths = doc['x-endpoints'].reduce((obj, endpoint) => {
    if (!obj[endpoint.path]) {
      obj[endpoint.path] = {}
    }
    obj[endpoint.path][endpoint.method] = Object.assign({}, endpoint)
    return obj
  }, {})

  return Object.assign({}, doc, {paths: paths})
}

module.exports = {
  async get(ctx, next) {
    try {
      const fullId = ctx.params.id + '.' + (ctx.query.version ? ctx.query.version : 'current') + '.' + (ctx.query.branch ? ctx.query.branch : 'master')
      const res = await elasticsearch.get('openapi', fullId, config.db)
      ctx.body = buildOpenApi(res)
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

  async versions(ctx, next) {
    try {
      const data = await elasticsearch.searchUri('doc', {parent: ctx.params.docId}, config.db)
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

  async branches(ctx, next) {
    try {
      const data = await elasticsearch.searchUri('doc', {parent: (ctx.params.docId + '.' + ctx.params.version)}, config.db)
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
  }
}
