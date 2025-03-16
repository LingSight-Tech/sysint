import { defaultMysqlConfigCenter as config } from "./config/center.mjs"

export const logger = {
  info: (message: string, extras?: Record<string, string>) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      ...(typeof extras === 'object' ? extras : {})
    }))
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack
    }))
  },
  warn: (message: string, extras?: Record<string, string>) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      message,
      ...(typeof extras === 'object' ? extras : {})
    }))
  },
  debug: (message: string, extras?: Record<string, string>) => {
    if (config.get('debug')) {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        message,
        ...(typeof extras === 'object' ? extras : {})
      }))
    }
  }
}