import proxy from 'koa-proxies'
import { defaultStorage as store, User } from '../infra/storage.mjs'
import Koa from 'koa'

declare module 'koa' {
  interface Context {
    state: {
      user: User
    }
  }
}

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

  const user = await store.getUserBySessionKey(token)
  if (!user) {
    ctx.status = 401
    ctx.body = {
      success: false,
      message: 'Unauthorized',
      data: null
    }
    return
  }

  ctx.state.user = user
  await next()
}