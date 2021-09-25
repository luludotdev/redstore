import { Decoder, Encoder } from '@msgpack/msgpack'
import Redis from 'ioredis'
import type { Redis as RedisInterface, RedisOptions } from 'ioredis'
import { Buffer } from 'node:buffer'
import { codec } from './codecs.js'

// eslint-disable-next-line @typescript-eslint/ban-types
interface AsyncProxy<T extends {}> {
  clear<K extends keyof T>(key: K): Promise<void>

  delete<K extends keyof T>(key: K): Promise<boolean>

  get<K extends keyof T>(key: K, defaultValue: T[K]): Promise<T[K]>
  get<K extends keyof T>(key: K, defaultValue?: T[K]): Promise<T[K] | undefined>

  has<K extends keyof T>(key: K): Promise<boolean>

  set<K extends keyof T>(key: K, value: T[K]): Promise<void>
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

  const encoder = new Encoder(codec)
  const decoder = new Decoder(codec)

  const proxy: AsyncProxy<T> = {
    async clear(key) {
      await redis.del(options.key, key.toString())
    },

    async delete(key) {
      const status = await redis.hdel(options.key, key.toString())
      return status === 1
    },

    async get(key, defaultValue) {
      const value = await redis.hgetBuffer(options.key, key.toString())
      if (value === null) return defaultValue

      const decoded = decoder.decode(value)
      return decoded
    },

    async has(key) {
      const status = await redis.hexists(options.key, key.toString())
      return status === 1
    },

    async set(key, value) {
      const encoded = encoder.encode(value)
      const buffer = Buffer.from(
        encoded.buffer,
        encoded.byteOffset,
        encoded.byteLength
      )

      await redis.hset(options.key, key.toString(), buffer)
    },
  }

  return Object.freeze(proxy)
}
