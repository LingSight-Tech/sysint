import Router from '@koa/router'
import { sleep } from '../util/sugar.mjs'
import { wechatRouter } from './wechat.mjs'
import { filesRouter } from './files.mjs'
import { conversationRouter } from './llm.mjs'
import { auth } from '../middleware/auth.mjs'
import { apiAudit } from '../middleware/api-audit.mjs'

export const router = new Router()

router.get('/hello', async (ctx, next) => {
  await sleep(1000);
  ctx.body = {
    hello: 'world'
  }
})

router.use(apiAudit)
router.use('/api', wechatRouter.routes(), wechatRouter.allowedMethods())
router.use(auth)
router.use('/api', filesRouter.routes(), filesRouter.allowedMethods())
router.use('/api', conversationRouter.routes(), conversationRouter.allowedMethods())
