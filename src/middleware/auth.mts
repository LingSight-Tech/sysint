import { logger } from '../infra/logger.mjs'
import { defaultStorage as store, User } from '../infra/storage.mjs'
import Koa from 'koa'
import { isEmptyObjOrNull } from '../util/sugar.mjs'

export const auth: Koa.Middleware = async (ctx, next) => {
  // token from header
  // get 'session:' + token from store
  // if not exists, return 401
  // if exists, parse it and set it to ctx.state.userSession
  // continue
  let token = ctx.get('Authorization')
  logger.info('AuthMiddleware: token', { token })
  if (!token) {
    ctx.status = 401
    ctx.body = {
      success: false,
      message: 'Unauthorized',
      data: null
    }
    return
  }

  if (token.startsWith('Bearer')) {
    token = token.substring(6).trim()
  }

  if (token.length === 0) {
    ctx.status = 401
    ctx.body = {
      success: false,
      message: 'Unauthorized',
      data: null
    }
    return
  }

  const user = await store.getUserBySessionKey(token)
  logger.info('AuthMiddleware: getUser', { token, user })
  if (isEmptyObjOrNull(user)) {
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
