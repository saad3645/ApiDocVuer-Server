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
  name: 'Mike Ehrmantraut',
  username: 'mike',
  email: 'mike@email.com',
  password_hash: bcrypt.hashSync('bettercallsaul', 10),
  acl: 'superuser'
}

const app1 = {
  name: 'app1',
  title: 'App 1',
  description: 'A description of App 1'
}

const app2 = {
  name: 'app2',
  title: 'App 2',
  description: 'A description of App 2'
}

const accessToken = {}

beforeAll(async () => {
  try {
    await elasticsearch.create('user', user.username, user, config.db)
    await elasticsearch.create('app', app1.name, app1, config.db)
    await elasticsearch.create('app', app2.name, app2, config.db)
    const res = await api.post('/login').send({'username': user.username, 'password': 'bettercallsaul'})
    accessToken.token = res.body.token
  }
  catch (error) {
    console.log(error)
    if (error.response.status !== 409) {
      process.exit(0)
    }
  }
}, 40000)

afterAll(async () => {
  try {
    await elasticsearch.delete('user', user.username, config.db)
    await elasticsearch.delete('app', app1.name, config.db)
    await elasticsearch.delete('app', app2.name, config.db)
  }
  catch (error) {
    console.log(error)
  }
}, 30000)

describe('GET /apps', function() {
  describe('Request does not contain Authorization header', function() {
    test('should return 401 with error message `Authorization header is missing or empty`', async function() {
      const response = await api.get('/apps')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_missing')
      expect(response.body.message).toEqual('Authorization header is missing or empty')
    })
  })
  describe('Authorization header does not contain `Bearer`', function() {
    // eslint-disable-next-line max-len
    test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
      const response = await api.get('/apps').set('Authorization', 'abcdef')
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
        const response = await api.get('/apps').set('Authorization', 'Bearer .')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer ..`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer ..')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer .abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer abcdef.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer .abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer abc.def.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc..def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps').set('Authorization', 'Bearer abc..def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
  })
  describe('Get list of apps', function() {
    test('should return 200 with app list', async function() {
      const response = await api.get('/apps').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('hits')
    })
  })
})

describe('GET /apps/:appId', function() {
  describe('Request does not contain Authorization header', function() {
    test('should return 401 with error message `Authorization header is missing or empty`', async function() {
      const response = await api.get('/apps/someapp')
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('authorization_missing')
      expect(response.body.message).toEqual('Authorization header is missing or empty')
    })
  })
  describe('Authorization header does not contain `Bearer`', function() {
    // eslint-disable-next-line max-len
    test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
      const response = await api.get('/apps/someapp').set('Authorization', 'abcdef')
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
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer .')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer ..`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer ..')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abcdef`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer .abcdef')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abcdef.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer abcdef.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer .abc.def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer .abc.def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc.def.`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer abc.def.')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
    describe('+ Authorization: `Bearer abc..def`', function() {
      // eslint-disable-next-line max-len
      test('should return 401 with error message `Authorization header is malformed, make sure you included `Bearer` before your access token`', async function() {
        const response = await api.get('/apps/someapp').set('Authorization', 'Bearer abc..def')
        expect(response.status).toEqual(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toEqual('authorization_malformed')
        expect(response.body.message).toEqual('Authorization header is malformed, make sure you included `Bearer` before your access token')
      })
    })
  })
  describe('Get non-existing app', function() {
    test('should return 404', async function() {
      const response = await api.get('/apps/someapp').set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(404)
    })
  })
  describe('Get a specific app', function() {
    test('should return 200 with the requested app', async function() {
      const response = await api.get('/apps/' + app1.name).set('Authorization', 'Bearer ' + accessToken.token)
      expect(response.status).toEqual(200)
    })
  })
})
