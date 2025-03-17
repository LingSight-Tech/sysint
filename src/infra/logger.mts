import { defaultMysqlConfigCenter as config } from "./config/center.mjs"

export const logger = {
  info: (message: string, extras?: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      ...(typeof extras === 'object' ? extras : {})
    }))
  },
  error: (message: string, error?: Error, extras?: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      ...(typeof extras === 'object' ? extras : {})
    }))
  },
  warn: (message: string, extras?: Record<string, any>) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      message,
      ...(typeof extras === 'object' ? extras : {})
    }))
  },
  debug: (message: string, extras?: Record<string, any>) => {
    if (config.get('debug')) {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        message,
        ...(typeof extras === 'object' ? extras : {})
      }))
    }
  }
}