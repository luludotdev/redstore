import Redis from 'ioredis'
import type { Redis as RedisInterface, RedisOptions } from 'ioredis'

// eslint-disable-next-line @typescript-eslint/ban-types
interface AsyncProxy<T extends {}> {
  get<K extends keyof T>(key: K, defaultValue: T[K]): Promise<T[K]>
  get<K extends keyof T>(key: K, defaultValue?: T[K]): Promise<T[K] | undefined>

  set<K extends keyof T>(key: K, value: T[K]): Promise<void>
}

interface Options {
  /**
   * Redis Connection
   */
  redis: RedisInterface | RedisOptions
}

/**
 * Create a new Async Store
 * @param options Store Options
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function createStore<T extends {}>(options: Options): AsyncProxy<T> {
  // eslint-disable-next-line prettier/prettier
  const redis = options.redis instanceof Redis
    ? options.redis
    : new Redis(options.redis)

  const proxy: AsyncProxy<T> = {
    async get(key, defaultValue) {
      // TODO
      console.log('get', { key })
    },

    async set(key, value) {
      // TODO
      console.log('set', { key, value })
    },
  }

  return Object.freeze(proxy)
}
