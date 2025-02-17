import { BusinessException } from "../error/error.mts"
import { defaultStaticJsonFileConfigCenter as config } from "../infra/config.mts"
import { logger } from '../infra/logger.mts'

interface WechatMiniProgramLoginResponse {
  session_key: string
  unionid: string
  errmsg: string
  openid: string
  errcode: number
}

export class WechatService {
  constructor(private appId: string, private secret: string) { }
  async login(code: string): Promise<{
    sessionKey: string
    unionId: string
    openId: string
  }> {
    logger.info(`Logging in with js_code: ${code}`)
    const result: WechatMiniProgramLoginResponse = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${this.appId}&secret=${this.secret}&js_code=${code}&grant_type=authorization_code`)
      .then(res => res.json())

    if (result.errcode) {
      logger.error(`Failed to login: ${result.errmsg}(${result.errcode}) with js_code: ${code}`)
      throw new BusinessException(500, `Failed to login: ${result.errmsg}(${result.errcode}) with js_code: ${code}`)
    }

    return {
      sessionKey: result.session_key,
      unionId: result.unionid,
      openId: result.openid
    }
  }
}

export const defaultWechatService = new WechatService(config.get('wechat.appid'), config.get('wechat.secret'))
