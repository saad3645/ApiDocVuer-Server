'use strict'

const config = require('config')
const axios = require('axios')

const options = {
  baseUrl: config.get('jsonbin.baseUrl'),
  binUrl: config.get('jsonbin.binUrl'),
  docsUrl: config.get('jsonbin.baseUrl') + config.get('jsonbin.binUrl') + '/' + config.get('jsonbin.docsBin'),
  secret: process.env.JSONBIN_SECRET
}

const getOpenApi = async function(id, options) {
  const url = options.baseUrl + options.binUrl + '/' + id
  const openapi = await axios.get(url, {headers: {'secret-key': options.secret}})
  return openapi.data
}

module.exports = {
  async list(ctx, next) {
    try {
      const docs = await axios.get(options.docsUrl, {headers: {'secret-key': options.secret}})
      ctx.body = {data: docs.data}
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
  },

  async get(ctx, next) {
    try {
      ctx.body = await getOpenApi(ctx.params.id, options)
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
  },

  async info(ctx, next) {
    try {
      const info = await getOpenApi(ctx.params.id, options).info
      ctx.body = {data: info}
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
  },

  async collections(ctx, next) {
    try {
      const res = await getOpenApi(ctx.params.id, options)
      if (res['x-collections']) {
        ctx.body = {data: res['x-collections']}
        ctx.status = 200
      }
      else {
        ctx.status = 204
      }
    }
    catch (error) {
      if (error.response.status === 404) {
        ctx.throw(404)
      }
      else {
        ctx.throw(503, error.message, {log: true})
      }
    }

    await next()
  }
}
