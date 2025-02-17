import { defaultStaticJsonFileConfigCenter as config } from "./config.mjs"

export const logger = {
  info: (message: string) => {
    console.log(`[INFO] ${message}`)
  },
  error: (message: string) => {
    console.error(`[ERROR] ${message}`)
  },
  warn: (message: string) => {
    console.warn(`[WARN] ${message}`)
  },
  debug: (message: string) => {
    const logLevel = config.get('log.level')
    if (logLevel === 'debug') {
      console.debug(`[DEBUG] ${message}`)
    }
  }
}