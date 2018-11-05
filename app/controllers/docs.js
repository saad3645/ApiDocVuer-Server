'use strict';

const config = require('config')
const axios = require('axios')

const getAppVersion = async function(appId, version, options) {
  if (version) {
    return version
  }
  else {
    const url = options.baseUrl + options.appname + '/apps/' + appId + '/_source'
    const res = await axios.get(url, {headers: {'Authorization': options.authorization}})
    return (res.data.currentVersion ? res.data.currentVersion : '')
  }
}

module.exports = {
  async get(ctx, next) {
    try {
      const appVersion = await getAppVersion(ctx.params.appId, ctx.params.version, config.appbase)
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
