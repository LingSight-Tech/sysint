import Router from '@koa/router'
import { defaultWechatService as wechatService } from '../integration/wx.mjs'
import { BusinessException } from '../error/error.mjs'
import { defaultDistributedCache as store } from '../integration/cache.mjs'
import { uuid } from '../util/random.mjs'

export const wechatRouter = new Router()
const ONE_WEEK_MILLS = 7 * 24 * 60 * 60 * 1000

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
    await store.set('session:' + token, JSON.stringify({
      sessionKey: result.sessionKey,
      unionId: result.unionId,
      openId: result.openId
    }), ONE_WEEK_MILLS)

    ctx.body = {
      success: true,
      message: 'ok',
      data: { token }
    }
  } catch (e) {
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