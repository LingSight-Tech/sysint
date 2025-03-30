import proxy from 'koa-proxies'
import { defaultMysqlConfigCenter as config } from '../infra/config/center.mjs'

export const amapProxy = proxy('/amap-proxy', {
  target: 'https://restapi.amap.com/',
  changeOrigin: false,
  logs: true,
  rewrite: path => {
    // remove /amap-proxy prefix
    const newPath = path.replace(/^\/amap-proxy/, '')

    // append key=xxx to query
    if (path.indexOf('?') === -1) {
      return `${newPath}?key=${config.get('amap.key')}`
    }

    return `${newPath}&key=${config.get('amap.key')}`
  }
})