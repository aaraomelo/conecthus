declare module 'keyv-redis' {
  export default class KeyvRedis {
    constructor(options?: Record<string, unknown>);
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown, ttl?: number): Promise<unknown>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }
}