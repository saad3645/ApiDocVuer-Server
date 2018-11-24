'use strict'

const config = require('config')
const elasticsearch = require('../elasticsearch')

const DOC_ID_REGEX = /^([a-zA-Z0-9_-]+)(?:\.([a-zA-Z0-9_-]+))?$/

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
    const docIdMatch = ctx.params.docId.match(DOC_ID_REGEX)
    ctx.assert(docIdMatch, 400, 'docId does not match expected pattern', {error: 'bad_request_param'})

    const query = {}
    if (docIdMatch[2]) {
      query.app = docIdMatch[1]
      query.doc = docIdMatch[2]
    }
    else {
      query.doc = docIdMatch[1]
    }

    try {
      const data = await elasticsearch.searchUri('docversion', query, 'AND', config.db)
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
    const docIdMatch = ctx.params.docId.match(DOC_ID_REGEX)
    ctx.assert(docIdMatch, 400, 'docId does not match expected pattern', {error: 'bad_request_param'})

    const query = {version: ctx.params.version}
    if (docIdMatch[2]) {
      query.app = docIdMatch[1]
      query.doc = docIdMatch[2]
    }
    else {
      query.doc = docIdMatch[1]
    }

    try {
      const data = await elasticsearch.searchUri('docbranch', query, 'AND', config.db)
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
