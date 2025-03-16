import { Database, defaultMysqlDatabase } from "../db.mjs"
import { logger } from "../logger.mjs"
import { defaultStaticJsonFileConfigCenter } from "./bootstrap.mjs"
import { ConfigCenter, ConfigChangeCallback } from "./types.js"

interface Config {
  id: number
  service: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

interface Listener {
  id: number
  callback: ConfigChangeCallback
}

class SqlDatabaseConfigCenter implements ConfigCenter {
  private localStore: Record<string, string> = {};
  private key2listeners: Record<string, Listener[]> = {};
  private id2listeners: Record<number, Listener> = {};
  private listenerId = 0;

  constructor(private db: Database) { }

  async init(): Promise<void> {
    this.refresh()
    this.scheduleRefresh()
    return Promise.resolve();
  }

  private scheduleRefresh(): void {
    setTimeout(async () => {
      await this.refresh()
      this.scheduleRefresh()
    }, 5_000)
  }

  private async refresh(): Promise<void> {
    try {
      const configs = await this.db.sql(`
          select id, \`key\`, value from config where service = '${defaultStaticJsonFileConfigCenter.get('service')}'
        `)
      const newStore: Record<string, string> = {}
      for (const config of configs as Config[]) {
        newStore[config.key] = config.value
        if (this.key2listeners[config.key]) {
          this.key2listeners[config.key].forEach(listener => {
            try {
              listener?.callback?.(this.localStore[config.key], config.value)
            } catch (e) {
              logger.error(`SqlDatabaseConfigCenter_init: Failed to notify listener for key ${config.key}`, e as Error)
            }
          })
        }
      }
      this.localStore = newStore
    } catch (e) {
      logger.error('SqlDatabaseConfigCenter_init: Failed to load config from database', e as Error)
    }
  }

  get(key: string): any {
    return this.localStore[key];
  }

  on(key: string, callback: ConfigChangeCallback): number {
    if (!this.key2listeners[key]) {
      this.key2listeners[key] = []
    }
    const listener = {
      id: this.listenerId,
      callback
    }
    this.key2listeners[key].push(listener)
    this.id2listeners[this.listenerId++] = listener

    return listener.id
  }

  off(id: number): void {
    const listener = this.id2listeners[id]
    if (!listener) {
      return
    }

    this.key2listeners[listener.id] = this.key2listeners[listener.id].filter(l => l.id !== id)
    delete this.id2listeners[id]
  }
}

export const defaultMysqlConfigCenter: ConfigCenter = new SqlDatabaseConfigCenter(defaultMysqlDatabase);
await defaultMysqlConfigCenter.init()
