import { createClient, RedisClientType } from 'redis'
import { defaultStaticJsonFileConfigCenter as config } from '../infra/config.mjs';

export interface DistributedCache {
  init(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expireTimeMills: number): Promise<void>;
}

export class RedisDistributedCache implements DistributedCache {
  private redis: RedisClientType;
  constructor(private config: { host: string, port: number, username: string, password: string, db: number }) {
    this.redis = createClient({
      url: `redis://${this.config.username ? this.config.username + ':' + this.config.password + '@' : ''}${this.config.host}:${this.config.port}/${this.config.db}`
    })
  }

  async init() {
    this.redis.on('error', (err) => {
      console.error('Redis error: ', err)
      process.exit(1)
    })

    await this.redis.connect()
  }

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, expireTimeMills: number): Promise<void> {
    await this.redis.set(key, value, {
      EX: expireTimeMills / 1000,
    })
  }
}

export const defaultDistributedSessionCache: DistributedCache = new RedisDistributedCache({
  host: config.get('session-cache.redis.host'),
  port: config.get('session-cache.redis.port'),
  username: config.get('session-cache.redis.username'),
  password: config.get('session-cache.redis.password'),
  db: config.get('session-cache.redis.db')
})

await defaultDistributedSessionCache.init()