'use strict';

const config = require('config')
const axios = require('axios')

const getCurrentVersion = async function(appId, options) {
  const url = options.baseUrl + options.appname + '/apps/' + appId + '/_source'
  const res = await axios.get(url, {headers: {'Authorization': options.authorization}})
  return (res.currentVersion ? res.currentVersion : '')
}

module.exports = {
  async get(ctx, next) {
    try {
      const appVersion = ctx.params.version ? ctx.params.version : getCurrentVersion(ctx.params.appId, config.appbase)
      const url = config.appbase.baseUrl + config.appbase.appname + '/docs/' + ctx.params.appId + ':' + ctx.params.docId + '@' + appVersion + '/_source'
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
