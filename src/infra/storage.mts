import { Database, defaultMysqlDatabase } from './db.mjs';

export interface Storage {
  getConversationsPage(id: any, offset: number, limit: number): Promise<Conversation[]>;
  updateConversation(conversationId: string, historyJson: string): Promise<void>;
  getConversation(conversationId: string): Promise<Conversation | undefined>;
  createConversation(userId: number, conversationId: string, initConversion: string): Promise<void>;
  updateUserSessionKey(openId: string, token: string): Promise<void>;
  createUser(user: { openId: string; sessionKey: string }): Promise<User | undefined>;
  getUserByOpenId(openId: string): Promise<User | undefined>;
  getUserBySessionKey(sessionKey: string): Promise<User | undefined>;
  init(): Promise<void>;

}

export class MysqlStorage implements Storage {
  constructor(private db: Database) {
  }
  async getConversationsPage(id: any, offset: number, limit: number): Promise<Conversation[]> {
    const result = await this.db.sql(`select * from conversation where user_id = ? order by updated_at desc limit ?, ?`, [id, offset, limit]) as any[]
    return result.map(toCamlCase) as Conversation[]
  }
  async updateConversation(conversationId: string, historyJson: string): Promise<void> {
    await this.db.sql(`update conversation set history_json = ? where uuid = ?`, [historyJson, conversationId])
  }

  async getConversation(conversationId: string): Promise<Conversation | undefined> {
    const result = await this.db.sql(`select * from conversation where uuid = ?`, [conversationId]) as any[]
    return toCamlCase(result[0])
  }

  async createConversation(userId: number, conversationId: string, initConversion: string): Promise<void> {
    await this.db.sql(`insert into conversation (uuid, user_id, history_json) values (?, ?, ?)`, [conversationId, userId, initConversion])
  }

  async updateUserSessionKey(openId: string, token: string): Promise<void> {
    await this.db.sql(`update user set session_key = ? where open_id = ?`, [token, openId]) as any
  }

  async createUser(user: { openId: string; sessionKey: string }): Promise<User | undefined> {
    await this.db.sql(`insert into user (open_id, session_key) values (?, ?, ?)`, [user.openId, user.sessionKey])
    const result = await this.db.sql(`select * from user where open_id = ?`, [user.openId]) as any[]
    return toCamlCase(result[0])
  }

  async getUserByOpenId(openId: string): Promise<User | undefined> {
    const result = await this.db.sql(`select * from user where open_id = ?`, [openId]) as any[]
    return toCamlCase(result[0])
  }
  async getUserBySessionKey(sessionKey: string): Promise<User | undefined> {
    const result = await this.db.sql(`select * from user where session_key = ?`, [sessionKey]) as any[]
    return toCamlCase(result[0])
  }



  async init(): Promise<void> { }
}

export interface User {
  id: number
  openId: string
  sessionKey: string
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: number
  uuid: string
  userId: number
  historyJson: Record<string, any>[]
  createdAt: Date
  updatedAt: Date
}

export const defaultStorage: Storage = new MysqlStorage(defaultMysqlDatabase)

await defaultStorage.init()
function toCamlCase<T>(o: Record<string, any>): T {
  const result: Record<string, any> = {}
  for (const key in o) {
    result[key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())] = o[key]
  }
  return result as T
}

