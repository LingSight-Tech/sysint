import Router from '@koa/router'
import { sleep } from '../util/sugar.mjs'
import { wechatRouter } from './wechat.mjs'
import { filesRouter } from './files.mjs'
import { defaultDistributedCache as store } from '../integration/cache.mjs'
import { conversationRouter } from './llm.mjs'

export const router = new Router()

router.get('/hello', async (ctx, next) => {
  await sleep(1000);
  store.set('hello', 'world', 10_000_000)
  ctx.body = {
    hello: 'world'
  }
})

router.use('/api', wechatRouter.routes(), wechatRouter.allowedMethods())
router.use('/api', filesRouter.routes(), filesRouter.allowedMethods())
router.use('/api', conversationRouter.routes(), conversationRouter.allowedMethods())
