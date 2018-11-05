'use strict'

module.exports = {
  app: {
    name: 'ApidocVuer',
    shortName: 'apidocvuer',
    author: 'Saad Ahmed',
    copyright: 'Saad Ahmed',
    version: '1.0.0',
    port: undefined
  },
  client: {
    origin: undefined
  },
  auth: {
    algorithm: 'HS512',
    maxAge: '12h',
    nonceLength: 10,
    secret: process.env.APP_SECRET
  },
  appbase: {
    baseUrl: 'https://scalr.api.appbase.io/',
    appname: process.env.APPBASE_APPNAME,
    authorization: 'Basic ' + Buffer.from(process.env.APPBASE_KEY).toString('base64')
  },
  jsonbin: {
    baseUrl: 'https://api.jsonbin.io/',
    binUrl: 'b',
    collectionId: undefined,
    usersBin: undefined,
    docsBin: undefined
  }
}
