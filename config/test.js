'use strict'

module.exports = {
  app: {
    port: 3000
  },
  client: {
    origin: 'http://localhost:3000'
  },
  db: {
    secure: false,
    url: 'localhost:9200',
    key: null,
    secret: null
  }
}
