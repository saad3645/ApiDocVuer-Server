'use strict';

const config = require('config')
const axios = require('axios')
const winston = require('winston')
const Logger = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
})

module.exports = {
  async get(ctx, next) {
    const baseUrl = config.get('jsonbin.baseUrl')
    const specUrl = config.get('jsonbin.binUrl') + '/' + config.get(('jsonbin.specBins.' + ctx.params.collection))
    const secret = config.get('jsonbin.secret')
    const specification = {}

    try {
      const res = await axios.get(specUrl, {baseURL: baseUrl, headers: {'secret-key': secret}});
      Logger.info(res.data);
      specification.data = res.data;
    }
    catch (error) {
      ctx.throw(503, error.message, {log: true});
    }

    ctx.body = specification
    ctx.status = 200
    await next()
  }
}
