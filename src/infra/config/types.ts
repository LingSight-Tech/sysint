
export type ConfigChangeCallback = (oldValue: any, newValue: any) => void

export interface ConfigCenter {
  init(): Promise<void>
  get(key: string): any
  on(key: string, callback: ConfigChangeCallback): number
  off(id: number): void
}
