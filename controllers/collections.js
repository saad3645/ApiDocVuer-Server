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
  async list(ctx, next) {
    const baseUrl = config.get('jsonbin.baseUrl')
    const collectionsUrl = config.get('jsonbin.binUrl') + '/' + config.get('jsonbin.collectionsBin')
    const secret = config.get('jsonbin.secret')
    const collections = {}

    try {
      const res = await axios.get(collectionsUrl, {baseURL: baseUrl, headers: {'secret-key': secret}});
      Logger.info(res.data);
      collections.data = res.data;
    }
    catch (error) {
      ctx.throw(503, error.message, {log: true});
    }

    ctx.body = collections
    ctx.status = 200
    await next()
  }
}
