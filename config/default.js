'use strict'

module.exports = {
  app: {
    name: 'ApiDocVuer',
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
    clockTolerance: 10,
    secret: process.env.APP_SECRET
  },
  db: {
    secure: true,
    sourceOnly: true,
    url: process.env.DATABASE_URL,
    clusterName: process.env.DATABASE_CLUSTER_NAME,
    key: process.env.DATABASE_KEY,
    secret: process.env.DATABASE_SECRET
  }
}
