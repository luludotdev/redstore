import type { Buffer } from 'node:buffer'
import { chunkStrict as chunk } from '@luludev/chunk'
import Redis from 'ioredis'
import type { Redis as RedisInterface, RedisOptions } from 'ioredis'
import { createCodec } from './msgpack.js'

interface AsyncProxy<T extends {}> {
  clear(): Promise<void>

  delete<K extends keyof T>(key: K): Promise<boolean>

  entries<K extends keyof T>(): AsyncIterable<readonly [K, T[K]]>

  get<K extends keyof T>(key: K, defaultValue: T[K]): Promise<T[K]>
  get<K extends keyof T>(key: K, defaultValue?: T[K]): Promise<T[K] | undefined>

  has<K extends keyof T>(key: K): Promise<boolean>

  keys<K extends keyof T>(): AsyncIterable<K>

  set<K extends keyof T>(key: K, value: T[K]): Promise<void>

  values<K extends keyof T>(): AsyncIterable<T[K]>

  disconnect(): Promise<void>
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

  /**
   * Sets gzip compression level. If unset, does not compress.
   *
   * **Use with caution!** In most cases compressing small data will result in *larger* sizes.
   */
  compressLevel?: number
}

const redisKey: (key: unknown) => string = key => {
  if (typeof key === 'string') return key
  if (typeof key === 'symbol') return key.toString()
  if (typeof key === 'number') return key.toString(10)

  throw new TypeError('invalid key type')
}

/**
 * Create a new Async Store
 *
 * @param options - Store Options
 */
export function createStore<T extends {}>(options: Options): AsyncProxy<T> {
  const storeKey = options.key
  const scanSize = options.scanSize ?? 10

  // prettier-ignore
  const redis = options.redis instanceof Redis ? options.redis : new Redis(options.redis)
  const { encode, decode } = createCodec(options.compressLevel)

  const proxy: AsyncProxy<T> = {
    async clear() {
      await redis.del(storeKey)
    },

    async delete(key) {
      const status = await redis.hdel(storeKey, redisKey(key))
      return status === 1
    },

    async get(key, defaultValue) {
      const value = await redis.hgetBuffer(storeKey, redisKey(key))
      if (value === null) return defaultValue

      return decode(value)
    },

    async has(key) {
      const status = await redis.hexists(storeKey, redisKey(key))
      return status === 1
    },

    async set(key, value) {
      const buffer = await encode(value)
      await redis.hset(storeKey, redisKey(key), buffer)
    },

    async *keys() {
      const keys = await redis.hkeys(storeKey)

      for (const key of keys) {
        // Hacky fix to make generics work
        yield key as never
      }
    },

    async *values() {
      for await (const [, value] of this.entries()) {
        // Hacky fix to make generics work
        yield value as never
      }
    },

    async *entries() {
      const stream = redis.hscanBufferStream(storeKey, { count: scanSize })
      for await (const data of stream) {
        const chunked = chunk(data as Buffer[], 2)

        for (const [rawKey, rawValue] of chunked) {
          const key = rawKey.toString('utf8')

          // eslint-disable-next-line no-await-in-loop
          const value = await decode(rawValue)

          // Hacky fix to make generics work
          yield [key, value] as never
        }
      }
    },

    async disconnect() {
      await redis.quit()
    },
  }

  return Object.freeze(proxy)
}
