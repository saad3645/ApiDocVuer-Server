'use strict'

module.exports = {
  app: {
    name: 'Api Document',
    shortName: 'api-document',
    createdBy: 'Saad Ahmed',
    copyright: 'Saad Ahmed',
    version: '1.0.0',
    port: undefined
  },
  client: {
    origin: undefined
  },
  auth: {
    algorithm: 'HS512',
    maxAge: '24h',
    nonceLength: 10
  },
  jsonbin: {
    baseUrl: 'https://api.jsonbin.io/',
    binUrl: 'b',
    collectionId: undefined,
    usersBin: undefined,
    docsBin: undefined
  }
}
