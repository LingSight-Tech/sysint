import { defaultMysqlConfigCenter as config } from '../infra/config/center.mjs'
import Koa from 'koa'
import { logger } from '../infra/logger.mjs'
import { uuid } from '../util/random.mjs'

export const apiAudit: Koa.Middleware = async (ctx, next) => {
  if (config.get('api-audit-logger.enabled') !== 'true') {
    await next()
    return
  }

  const requestId = uuid()
  const start = Date.now()
  logger.info(`request ${requestId}`, {
    method: ctx.method,
    url: ctx.url,
    path: ctx.path,
    headers: ctx.headers,
    requestBody: ctx.request.body,
    query: ctx.query,
    requestId
  })

  try {
    await next()
  } catch (e) {
    const cost = Date.now() - start
    logger.error(`response error ${requestId}`, e as Error, {
      method: ctx.method,
      url: ctx.url,
      path: ctx.path,
      headers: ctx.headers,
      requestBody: ctx.request.body,
      query: ctx.query,

      status: ctx.status,
      responseBody: ctx.body,
      cost,

      requestId,
    })
    throw e
  }

  const cost = Date.now() - start
  logger.info(`response success ${requestId}`, {
    method: ctx.method,
    url: ctx.url,
    path: ctx.path,
    headers: ctx.headers,
    requestBody: ctx.request.body,
    query: ctx.query,

    status: ctx.status,
    responseBody: ctx.body,
    cost,

    requestId,
  })
}