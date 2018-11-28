'use strict'
/* eslint-env jest */

require('dotenv').config()
const config = require('config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')
const app = require('../app/index')
const api = supertest(app.callback())
const elasticsearch = require('../app/elasticsearch')

const user = {
  name: 'Nacho Varga',
  username: 'nacho',
  email: 'nacho@email.com',
  password_hash: bcrypt.hashSync('bettercallsaul', 10),
  acl: 'superuser'
}

const app1 = {
  name: 'petstore',
  title: 'Petstore App',
  description: 'A description of Petstore App'
}

const collection1 = require('./petstore.db.json')

const version1 = {
  app: 'petstore',
  collection: 'collection',
  version: '1.0.0',
  parent: 'petstore.collection'
}

const version2 = {
  app: 'petstore',
  collection: 'collection',
  version: '2.0.0',
  parent: 'petstore.collection'
}

const branchMaster = {
  app: 'petstore',
  collection: 'collection',
  version: '2.0.0',
  branch: 'master',
  parent: 'petstore.collection.2.0.0'
}

const branchDev = {
  app: 'petstore',
  collection: 'collection',
  version: '2.0.0',
  branch: 'dev',
  parent: 'petstore.collection.2.0.0'
}

const accessToken = {}

beforeAll(async () => {
  try {
    await elasticsearch.create('user', user.username, user, config.db)
    await elasticsearch.create('app', app1.name, app1, config.db)
    await elasticsearch.create('openapi', (collection1.info['x-documentId'] + '.current.master'), collection1, config.db)
    await elasticsearch.create('doc', (version1.parent + '.' + version1.version), version1, config.db)
    await elasticsearch.create('doc', (version2.parent + '.' + version2.version), version2, config.db)
    await elasticsearch.create('doc', (branchMaster.parent + '.' + branchMaster.branch), branchMaster, config.db)
    await elasticsearch.create('doc', (branchDev.parent + '.' + branchDev.branch), branchDev, config.db)
    const res = await api.post('/login').send({'username': user.username, 'password': 'bettercallsaul'})
    accessToken.token = res.body.token
  }
  catch (error) {
    console.log(error)
    if (error.response.status !== 409) {
      process.exit(0)
    }
  }
}, 60000)

afterAll(async () => {
  try {
    await elasticsearch.delete('user', user.username, config.db)
    await elasticsearch.delete('app', app1.name, config.db)
    await elasticsearch.delete('openapi', (collection1.info['x-documentId'] + '.current.master'), config.db)
    await elasticsearch.delete('doc', (version1.parent + '.' + version1.version), config.db)
    await elasticsearch.delete('doc', (version2.parent + '.' + version2.version), config.db)
    await elasticsearch.delete('doc', (branchMaster.parent + '.' + branchMaster.branch), config.db)
    await elasticsearch.delete('doc', (branchDev.parent + '.' + branchDev.branch), config.db)
  }
  catch (error) {
    console.log(error)
  }
}, 60000)

describe('GET /docs/:id', function() {
  describe('Request does not contain Authorization header', function() {
    test('should return 401 with error message `Authorization header is missing or empty`', async function() {
      const response = await api.get('/docs/somedoc')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_missing')
      expect(response.body.message).toEqual('Authorization header is missing or empty')
    })
  })
  describe('Authorization header does not contain `Bearer`', function() {
    // eslint-disable-next-line max-len
    test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
      const response = await api.get('/docs/somedoc').set('Authorization', 'abcdef')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_malformed')
      expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
    })
  })
  describe('Access token is malformed', function() {
    describe('+ Authorization: `Bearer .`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer .')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer ..`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer ..')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer .abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer abcdef.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer .abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer abc.def.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc..def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer abc..def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
  })
  describe('Get non-existing collection', function() {
    test('should return 404', async function() {
      const response = await api.get('/docs/somedoc').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(404)
    })
  })
  describe('Get a specific collection (version or branch not specified)', function() {
    test('should return 200 with the requested collection (current, master)', async function() {
      const response = await api.get('/docs/' + collection1.info['x-documentId']).set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
    })
  })
  describe('Get a non-existing collection version', function() {
    test('should return 404', async function() {
      const response = await api.get('/docs/' + collection1.info['x-documentId'] + '?version=1.0.2').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(404)
    })
  })
  describe('Get a specific collection version (branch not specified)', function() {
    test('should return 200 with the requested collection (master branch)', async function() {
      const response = await api.get('/docs/' + collection1.info['x-documentId'] + '?version=current').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
    })
  })
  describe('Get a non-existing collection branch', function() {
    test('should return 404', async function() {
      const response = await api.get('/docs/' + collection1.info['x-documentId'] + '?branch=foo').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(404)
    })
  })
  describe('Get a specific collection branch (version not specified)', function() {
    test('should return 200 with the requested collection (current version)', async function() {
      const response = await api.get('/docs/' + collection1.info['x-documentId'] + '?branch=master').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
    })
  })
  describe('Get a specific collection branch of a specific version', function() {
    test('should return 200 with the requested collection', async function() {
      // eslint-disable-next-line max-len
      const response = await api.get('/docs/' + collection1.info['x-documentId'] + '?version=current&branch=master').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
    })
  })
})

describe('GET /docs/:openapi/versions', function() {
  describe('Request does not contain Authorization header', function() {
    test('should return 401 with error message `Authorization header is missing or empty`', async function() {
      const response = await api.get('/docs/somedoc/versions')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_missing')
      expect(response.body.message).toEqual('Authorization header is missing or empty')
    })
  })
  describe('Authorization header does not contain `Bearer`', function() {
    // eslint-disable-next-line max-len
    test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
      const response = await api.get('/docs/somedoc/versions').set('Authorization', 'abcdef')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_malformed')
      expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
    })
  })
  describe('Access token is malformed', function() {
    describe('+ Authorization: `Bearer .`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer .')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer ..`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer ..')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer .abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer abcdef.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer .abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer abc.def.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc..def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer abc..def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
  })
  describe('Get list of versions of a non-existing collection', function() {
    test('should return 200 with an empty `hits` array', async function() {
      const response = await api.get('/docs/somedoc/versions').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('hits')
      expect(response.body.total).toEqual(0)
      expect(response.body.hits).toHaveLength(0)
    })
  })
  describe('Get list of versions of a specific collection', function() {
    test('should return 200 with version list', async function() {
      const response = await api.get('/docs/' + collection1.info['x-documentId'] + '/versions').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('hits')
      expect(response.body.total).toBeGreaterThan(0)
      expect(response.body.hits.length).toBeGreaterThan(0)
    })
  })
})

describe('GET /docs/:openapi/:version/branches', function() {
  describe('Request does not contain Authorization header', function() {
    test('should return 401 with error message `Authorization header is missing or empty`', async function() {
      const response = await api.get('/docs/somedoc/1.0.0/branches')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_missing')
      expect(response.body.message).toEqual('Authorization header is missing or empty')
    })
  })
  describe('Authorization header does not contain `Bearer`', function() {
    // eslint-disable-next-line max-len
    test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
      const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'abcdef')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_malformed')
      expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
    })
  })
  describe('Access token is malformed', function() {
    describe('+ Authorization: `Bearer .`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer .')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer ..`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer ..')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer .abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer abcdef.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer .abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer abc.def.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc..def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/docs/somedoc/1.0.0/branches').set('Authorization', 'Bearer abc..def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
  })
  describe('Get list of branches of a non-existing collection or version', function() {
    test('should return 200 with an empty `hits` array', async function() {
      const response = await api.get('/docs/somedoc/1.0.1/branches').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('hits')
      expect(response.body.total).toEqual(0)
      expect(response.body.hits).toHaveLength(0)
    })
  })
  describe('Get list of branches of a specific collection version', function() {
    test('should return 200 with branch list', async function() {
      const response = await api.get('/docs/' + collection1.info['x-documentId'] + '/2.0.0/branches').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('hits')
      expect(response.body.total).toBeGreaterThan(0)
      expect(response.body.hits.length).toBeGreaterThan(0)
    })
  })
})
