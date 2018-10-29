'use strict'

module.exports = {
  async render(ctx, next) {
    if (ctx.query && ctx.query.user && ctx.query.token) {
      ctx.render('redoc', {user: ctx.query.user, token: ctx.query.token})
    }
    else {
      ctx.render('not_found')
    }
    await next()
  }
}
