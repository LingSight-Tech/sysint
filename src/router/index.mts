import Router from '@koa/router'
import { sleep } from '../util/sugar.mts'
import { wechatRouter } from './wechat.mts'
import { filesRouter } from './files.mts'
import { defaultDistributedSessionCache as sessionCache } from '../integration/cache.mts'

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
