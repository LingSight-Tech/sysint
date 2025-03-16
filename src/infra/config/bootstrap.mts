import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { ConfigCenter, ConfigChangeCallback } from './types.js';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

class StaticJsonFileConfigCenter implements ConfigCenter {
  private store: Record<string, object> = {};
  private loaded = false;

  constructor(private filePath: string) { }

  async init(): Promise<void> {
    const content = await fs.readFile(this.filePath, 'utf-8');
    this.store = JSON.parse(content)
    this.loaded = true
  }

  get(key: string): any {
    if (!this.loaded) {
      throw new Error('ConfigCenter not initialized');
    }

    return this.store[key];
  }

  on(key: string, callback: ConfigChangeCallback): number {
    return -1;
  }

  off(id: number): void { }
}

export const defaultStaticJsonFileConfigCenter: ConfigCenter = new StaticJsonFileConfigCenter(path.resolve(__dirname, '../../../config/config.json'));
await defaultStaticJsonFileConfigCenter.init();
