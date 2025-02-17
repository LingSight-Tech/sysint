import Router from '@koa/router'
import { sleep } from '../util/sugar.mjs'
import { wechatRouter } from './wechat.mjs'
import { filesRouter } from './files.mjs'
import { defaultDistributedSessionCache as sessionCache } from '../integration/cache.mjs'

export const router = new Router()

router.get('/hello', async (ctx, next) => {
  await sleep(1000);
  sessionCache.set('hello', 'world', 10_000_000)
  ctx.body = {
    hello: 'world'
  }
})

router.use('/api', wechatRouter.routes(), wechatRouter.allowedMethods())
router.use('/api', filesRouter.routes(), filesRouter.allowedMethods())
