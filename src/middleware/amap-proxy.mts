import proxy from 'koa-proxies'
import { defaultMysqlConfigCenter as config } from '../infra/config/center.mjs'

export const amapProxy = proxy('/amap-proxy', {
  target: 'https://restapi.amap.com/',
  changeOrigin: false,
  logs: true,
  rewrite: path => {
    // remove /amap-proxy prefix
    const newPath = path.replace(/^\/amap-proxy/, '')
    let amapKey = config.get('amap.key')
    if (newPath.startsWith('/v5/place/around')) {
      amapKey = config.get('amap.key.place')
    }

    // append key=xxx to query
    if (path.indexOf('?') === -1) {
      return `${newPath}?key=${amapKey}`
    }

    return `${newPath}&key=${amapKey}`
  }
})