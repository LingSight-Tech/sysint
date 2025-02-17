import Router from '@koa/router'
import { defaultCosService as cosService } from '../integration/cos.mts'
import { v4 as uuid } from 'uuid'

export const filesRouter = new Router()

const ONE_DAY_MILLS = 24 * 60 * 60 * 1000

filesRouter.get('/files/upload-url', async (ctx, next) => {
  const key = uuid()
  const url = await cosService.getUploadUrl(key, ctx.query.contentType as string)
  ctx.body = {
    success: true,
    message: 'ok',
    data: {
      fileId: key,
      putUrl: url
    }
  }
})

filesRouter.get('/files/get', async (ctx, next) => {
  const key = ctx.query.fileId as string
  if (!key) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'fileId is required',
      data: null
    }
    return;
  }

  const url = await cosService.getObjectPreviewUrl(key, ONE_DAY_MILLS)
  ctx.body = {
    success: true,
    message: 'ok',
    data: {
      previewUrl: url
    }
  }
})

