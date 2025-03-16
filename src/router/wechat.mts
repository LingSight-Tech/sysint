import Router from '@koa/router'
import { defaultWechatService as wechatService } from '../integration/wx.mjs'
import { BusinessException } from '../error/error.mjs'
import { defaultStorage as store } from '../infra/storage.mjs'
import { uuid } from '../util/random.mjs'
import { logger } from '../infra/logger.mjs'

export const wechatRouter = new Router()

wechatRouter.post('/login', async (ctx, next) => {
  if (!ctx.request.body?.code) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'code is required',
      data: null
    }
    return
  }

  try {
    const result = await wechatService.login(ctx.request.body?.code)
    const token = uuid()
    const user = await store.getUserByUnionId(result.unionId)
    if (!user) {
      await store.createUser({
        openId: result.openId,
        unionId: result.unionId,
        sessionKey: token
      })
    } else {
      await store.updateUserSessionKey(result.unionId, token)
    }

    ctx.body = {
      success: true,
      message: 'ok',
      data: { token }
    }
  } catch (e) {
    logger.error('Failed to login', e as Error)

    if (e instanceof BusinessException) {
      ctx.status = e.status
      ctx.body = {
        success: false,
        message: e.message,
        data: null
      }
      return
    }

    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal Server Error',
      data: null
    }
  }
})

export interface UserSession {
  sessionKey: string
  unionId: string
  openId: string
}