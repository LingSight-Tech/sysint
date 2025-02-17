import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

interface ConfigCenter {
  init(): Promise<void>
  get(key: string): any
  set(key: string, value: any): void
  on(key: string, callback: Function): number
  off(id: number): void
}

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

  set(key: string, value: any): void {
    this.store[key] = value;
  }

  on(key: string, callback: Function): number {
    return -1;
  }

  off(id: number): void { }
}

export const defaultStaticJsonFileConfigCenter: ConfigCenter = new StaticJsonFileConfigCenter(path.resolve(__dirname, '../../config/config.json'));
await defaultStaticJsonFileConfigCenter.init();
