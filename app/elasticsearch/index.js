'use strict'

const axios = require('axios')

const buildQueryUriString = (query, queryType) => {
  const q = Object.keys(query).map(key => {
    return {key: key, value: query[key]}
  })

  if (q.length === 0) {
    return null
  }

  if (queryType.toLowerCase() === 'simple' || queryType.toLowerCase() === 'or' || queryType.toLowerCase() === 'and') {
    if (q.length === 1) {
      return (q[0].key + ':' + q[0].value)
    }
    else {
      return q.reduce((qs, item, index) => {
        if (index > 0) {
          if (queryType.toLowerCase() === 'simple' || queryType.toLowerCase() === 'or') {
            return qs + 'OR(' + item.key + ':' + item.value + ')'
          }
          else if (queryType.toLowerCase() === 'and') {
            return qs + 'AND(' + item.key + ':' + item.value + ')'
          }
          else {
            return qs
          }
        }
        else {
          return '(' + item.key + ':' + item.value + ')'
        }
      }, '')
    }
  }
}

module.exports = {
  async create(index, data, id, options) {
    if (typeof id === 'object' && !options) {
      options = id
      id = null
    }
    const httpPrefix = options.secure ? 'https://' : 'http://'
    const auth = (options.key ? options.key : '') + (options.secret ? (':' + options.secret) : '') + (options.key || options.secret ? '@' : '')
    const url = httpPrefix + auth + options.url + '/' + index + '/_doc' + (id ? ('/' + id + '/_create') : '')
    const res = id ? await axios.put(url, data) : await axios.post(url, data)
    return res.data
  },

  async get(index, id, options) {
    const httpPrefix = options.secure ? 'https://' : 'http://'
    const auth = (options.key ? options.key : '') + (options.secret ? (':' + options.secret) : '') + (options.key || options.secret ? '@' : '')
    const url = httpPrefix + auth + options.url + '/' + index + '/_doc/' + id + (options.sourceOnly ? '/_source' : '')
    const res = await axios.get(url)
    return res.data
  },

  async delete(index, id, options) {
    const httpPrefix = options.secure ? 'https://' : 'http://'
    const auth = (options.key ? options.key : '') + (options.secret ? (':' + options.secret) : '') + (options.key || options.secret ? '@' : '')
    const url = httpPrefix + auth + options.url + '/' + index + '/_doc/' + id
    const res = await axios.delete(url)
    return res.data
  },

  async searchUri(index, query, queryType, options) {
    if (typeof queryType === 'object' && typeof options === 'undefined') {
      options = queryType
      queryType = 'simple'
    }

    const httpPrefix = options.secure ? 'https://' : 'http://'
    const auth = (options.key ? options.key : '') + (options.secret ? (':' + options.secret) : '') + (options.key || options.secret ? '@' : '')

    const qs = buildQueryUriString(query, queryType)

    const url = httpPrefix + auth + options.url + '/' + index + '/_search' + (qs && qs.length > 0 ? '?q=' + qs : '')
    const res = await axios.get(url)
    return res.data
  },

  async list(index, options) {
    const data = await this.searchUri(index, {}, options)
    return data
  },

  async count(index, options) {
    const httpPrefix = options.secure ? 'https://' : 'http://'
    const auth = (options.key ? options.key : '') + (options.secret ? (':' + options.secret) : '') + (options.key || options.secret ? '@' : '')
    const url = httpPrefix + auth + options.url + '/' + index + '/_count'
    const res = await axios.get(url)
    return res.data.count
  }
}
