'use strict'
/* eslint-env jest */

require('dotenv').config()
const config = require('config')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')
const server = require('../app/server')
const elasticsearch = require('../app/elasticsearch')
const api = supertest(server)

const user = {
  name: 'James Morgan McGill',
  username: 'jimmy',
  email: 'jimmy@email.com',
  password_hash: bcrypt.hashSync('bettercallsaul', 10),
  acl: 'superuser'
}

const testAuth = {
  username: user.username,
  password: 'bettercallsaul'
}

const testToken = {}

beforeAll(async () => {
  try {
    await elasticsearch.create('user', user, user.username, config.db)
  }
  catch (error) {
    console.log(error)
    process.exit(1)
  }
})

afterAll(async () => {
  try {
    await elasticsearch.delete('user', user.username, config.db)
  }
  catch (error) {
    console.log(error)
    process.exit(1)
  }
  server.close()
})

describe('[PUT] /login', function() {
  describe('Request body is empty', function() {
    test('should return 422 with error message `should have required property \'username\'`', async function() {
      const response = await api.post('/login')
      expect(response.status).toEqual(422)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors.length).toBeGreaterThan(0)
      expect(response.body.errors[0].message).toEqual('should have required property \'username\'')
    })
  })
  describe('Request body is an empty object', function() {
    test('should return 400 with error message `should have required property \'username\'`', async function() {
      const response = await api.post('/login').send({})
      expect(response.status).toEqual(422)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors.length).toBeGreaterThan(0)
      expect(response.body.errors[0].message).toEqual('should have required property \'username\'')
    })
  })
  describe('Request body is an empty array', function() {
    test('should return 400 with error message `Request body should be a valid json object`', async function() {
      const response = await api.post('/login').send([])
      expect(response.status).toEqual(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual('request_body_malformed')
      expect(response.body.message).toEqual('Request body should be a valid json object')
    })
  })
  describe('Request body does not contain username', function() {
    test('should return 422 with error message `should have required property \'username\'`', async function() {
      const response = await api.post('/login').send({'password': 'secret'})
      expect(response.status).toEqual(422)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors.length).toBeGreaterThan(0)
      expect(response.body.errors[0].message).toEqual('should have required property \'username\'')
    })
  })
  describe('Request body does not contain password', function() {
    test('should return 422 with error message `should have required property \'password\'`', async function() {
      const response = await api.post('/login').send({'username': 'jimmy'})
      expect(response.status).toEqual(422)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors.length).toBeGreaterThan(0)
      expect(response.body.errors[0].message).toEqual('should have required property \'password\'')
    })
  })
  describe('User does not exist', function() {
    test('should return 401 with error message `Invalid username and password`', async function() {
      const response = await api.post('/login').send({'username': 'superman', 'password': 'superman'})
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual(401)
      expect(response.body.message).toEqual('Invalid username and password')
    })
  })
  describe('Password is incorrect', function() {
    test('should return 401 with error message `Invalid username and password`', async function() {
      const response = await api.post('/login').send({'username': testAuth.username, 'password': 'password'})
      expect(response.status).toEqual(401)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toEqual(401)
      expect(response.body.message).toEqual('Invalid username and password')
    })
  })
  describe('Login user', function() {
    test('should return 200 with (access) token and ttl', async function() {
      const response = await api.post('/login').send({'username': testAuth.username, 'password': testAuth.password})
      expect(response.status).toEqual(200)
      expect(response.body.status).toEqual('ok')
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('ttl')
    })
  })
})
