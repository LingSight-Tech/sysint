import { defaultStaticJsonFileConfigCenter as config } from "./config.mjs"

export const logger = {
  info: (message: string) => {
    console.log(`[INFO] ${message}`)
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`)
    if (error) {
      console.error(error)
    }
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