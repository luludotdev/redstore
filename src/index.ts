import Redis from 'ioredis'
import type { Redis as RedisInterface, RedisOptions } from 'ioredis'
import type { Buffer } from 'node:buffer'
import { chunk, zip } from './arrayUtils.js'
import { createCodec } from './msgpack.js'

// eslint-disable-next-line @typescript-eslint/ban-types
interface AsyncProxy<T extends {}> {
  clear<K extends keyof T>(key: K): Promise<void>

  delete<K extends keyof T>(key: K): Promise<boolean>

  entries<K extends keyof T>(): AsyncIterable<readonly [K, T[K]]>

  get<K extends keyof T>(key: K, defaultValue: T[K]): Promise<T[K]>
  get<K extends keyof T>(key: K, defaultValue?: T[K]): Promise<T[K] | undefined>

  has<K extends keyof T>(key: K): Promise<boolean>

  keys<K extends keyof T>(): AsyncIterable<K>

  set<K extends keyof T>(key: K, value: T[K]): Promise<void>

  values<K extends keyof T>(): AsyncIterable<T[K]>
}

interface Options {
  /**
   * Redis Key
   */
  key: string

  /**
   * Redis Connection
   */
  redis: RedisInterface | RedisOptions

  /**
   * Redis Scan Size
   *
   * Defaults to `10`
   */
  scanSize?: number
}

/**
 * Create a new Async Store
 * @param options Store Options
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function createStore<T extends {}>(options: Options): AsyncProxy<T> {
  const storeKey = options.key
  const scanSize = options.scanSize ?? 10

  // eslint-disable-next-line prettier/prettier
  const redis = options.redis instanceof Redis
    ? options.redis
    : new Redis(options.redis)

  const { encode, decode } = createCodec()

  const genKey: (key: unknown) => string = key => {
    if (typeof key === 'string') return key
    if (typeof key === 'symbol') return key.toString()
    if (typeof key === 'number') return key.toString(10)

    throw new TypeError('invalid key type')
  }

  const proxy: AsyncProxy<T> = {
    async clear(key) {
      await redis.del(storeKey, genKey(key))
    },

    async delete(key) {
      const status = await redis.hdel(storeKey, genKey(key))
      return status === 1
    },

    async get(key, defaultValue) {
      const value = await redis.hgetBuffer(storeKey, genKey(key))
      if (value === null) return defaultValue

      const decoded = decode(value)
      return decoded
    },

    async has(key) {
      const status = await redis.hexists(storeKey, genKey(key))
      return status === 1
    },

    async set(key, value) {
      const buffer = encode(value)
      await redis.hset(storeKey, genKey(key), buffer)
    },

    async *keys() {
      const keys = await redis.hkeys(storeKey)

      for (const key of keys) {
        // Hacky fix to make generics work
        yield key as any
      }
    },

    async *values() {
      for await (const [, value] of this.entries()) {
        // Hacky fix to make generics work
        yield value as any
      }
    },

    async *entries() {
      const stream = redis.hscanStream(storeKey, { count: scanSize })
      for await (const data of stream) {
        const chunked = chunk(data, 2)

        const p = redis.pipeline()
        for (const [key] of chunked) {
          p.hgetBuffer(storeKey, key as string)
        }

        const results = await p.exec()
        const errors = results.map(([error]) => error)
        const error = errors.find(error => error !== null)
        if (error instanceof Error) {
          throw error
        }

        const keys = chunked.map(([key]) => key)
        const values = results.map(([, value]) => value as unknown)
        const zipped = zip(keys, values)

        for (const [key, rawValue] of zipped) {
          const value = decode(rawValue as Buffer)

          // Hacky fix to make generics work
          yield [key, value] as any
        }
      }
    },
  }

  return Object.freeze(proxy)
}
