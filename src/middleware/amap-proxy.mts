import proxy from 'koa-proxies'
import { defaultStaticJsonFileConfigCenter as config } from '../infra/config.mjs'

export const amapProxy = proxy('/_AMapService', {
  target: 'https://restapi.amap.com/',
  changeOrigin: true,
  logs: true,
  rewrite: path => {
    // append jscode=xxx to query
    if (path.indexOf('?') === -1) {
      return `${path}?jscode=${config.get('amap.jscode')}`
    }

    return `${path}&jscode=${config.get('amap.jscode')}`
  }
})