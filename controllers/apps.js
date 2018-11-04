'use strict'

const config = require('config')
const axios = require('axios')

module.exports = {
  async list(ctx, next) {
    try {
      const url = config.appbase.baseUrl + config.appbase.appname + '/apps/list/_source'
      const res = await axios.get(url, {headers: {'Authorization': config.appbase.authorization}})
      ctx.body = res.data
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
      const url = config.appbase.baseUrl + config.appbase.appname + '/apps/' + ctx.params.id + '/_source'
      const res = await axios.get(url, {headers: {'Authorization': config.appbase.authorization}})
      ctx.body = res.data
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

  async docs(ctx, next) {
    try {
      const url = config.appbase.baseUrl + config.appbase.appname + '/docs/' + ctx.params.id + '/_source'
      const res = await axios.get(url, {headers: {'Authorization': config.appbase.authorization}})
      ctx.body = res.data
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
