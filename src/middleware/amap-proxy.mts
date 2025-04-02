import proxy from 'koa-proxies'
import Koa from 'koa'
import { defaultMysqlConfigCenter as config } from '../infra/config/center.mjs'

const mdwFun = proxy('/amap-proxy', {
  target: 'https://restapi.amap.com/',
  changeOrigin: false,
  logs: true,
  rewrite: path => { // remove /amap-proxy prefix
    let newPath = path.replace(/^\/amap-proxy/, '')
    let amapKey = undefined
    if (newPath.startsWith('/mini/')) {
      amapKey = config.get('amap.key.mini')
      newPath = newPath.replace(/^\/mini/, '')
    } else if (newPath.startsWith('/web/')) {
      amapKey = config.get('amap.key.web')
      newPath = newPath.replace(/^\/web/, '')
    }

    if (!amapKey) {
      throw new Error('Invalid amap proxy prefix')
    }

    // append key=xxx to query
    if (path.indexOf('?') === -1) {
      return `${newPath}?key=${amapKey}`
    }

    return `${newPath}&key=${amapKey}`
  }
})

export const amapProxy: Koa.Middleware = (ctx, next) => {
  try {
    return mdwFun(ctx, next)
  } catch (e) {
    console.error('AmapProxy error', e)
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'AmapProxy error',
      data: null
    }
  }
}
