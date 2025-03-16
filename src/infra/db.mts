import { defaultStaticJsonFileConfigCenter as config } from './config/bootstrap.mjs';
import mysql, { QueryResult } from 'mysql2/promise';

export interface Database {
  init(): Promise<void>;
  sql(query: string, values?: any[]): Promise<Record<string, any>[]>;
}

export class MysqlDatabase implements Database {
  private pool: mysql.Pool;
  constructor(config: { host: string, port: number, username: string, password: string, db: string, connectionLimit: number, waitForConnections: boolean, queueLimit: number }) {
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.db,
      connectionLimit: config.connectionLimit,
      waitForConnections: config.waitForConnections,
      queueLimit: config.queueLimit
    })
  }

  async init(): Promise<void> {
    const test = await this.pool.getConnection()
    test.release()
  }

  async sql(query: string, values?: any[]): Promise<Record<string, any>[]> {
    const result: any = await this.pool.query(query, values)
    if (result?.[0]?.length == undefined) {
      return []
    }
    return result[0] as Record<string, any>[]
  }
}

export const defaultMysqlDatabase: Database = new MysqlDatabase({
  host: config.get('mysql.host'),
  port: config.get('mysql.port'),
  username: config.get('mysql.username'),
  password: config.get('mysql.password'),
  db: config.get('mysql.database'),
  connectionLimit: config.get('mysql.connection-limit'),
  waitForConnections: config.get('mysql.wait-for-connections'),
  queueLimit: config.get('mysql.queue-limit')
})

await defaultMysqlDatabase.init()
