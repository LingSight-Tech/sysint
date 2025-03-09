import proxy from 'koa-proxies'
import { defaultDistributedCache as store } from '../integration/cache.mjs'
import Koa from 'koa'

export const auth: Koa.Middleware = async (ctx, next) => {
  // token from header
  // get 'session:' + token from store
  // if not exists, return 401
  // if exists, parse it and set it to ctx.state.userSession
  // continue
  let token = ctx.get('Authorization')
  if (!token) {
    ctx.status = 401
    ctx.body = {
      success: false,
      message: 'Unauthorized',
      data: null
    }
    return
  }

  if (token.startsWith('Bearer ')) {
    token = token.substring(7)
  }

  const session = await store.get('session:' + token)
  if (!session) {
    ctx.status = 401
    ctx.body = {
      success: false,
      message: 'Unauthorized',
      data: null
    }
    return
  }

  ctx.state.userSession = JSON.parse(session)
  await next()
}