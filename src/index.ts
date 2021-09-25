import { Decoder, Encoder } from '@msgpack/msgpack'
import Redis from 'ioredis'
import type { Redis as RedisInterface, RedisOptions } from 'ioredis'
import { Buffer } from 'node:buffer'
import { codec } from './codecs.js'

// eslint-disable-next-line @typescript-eslint/ban-types
interface AsyncProxy<T extends {}> {
  get<K extends keyof T>(key: K, defaultValue: T[K]): Promise<T[K]>
  get<K extends keyof T>(key: K, defaultValue?: T[K]): Promise<T[K] | undefined>

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
    async get(key, defaultValue) {
      const value = await redis.hgetBuffer(options.key, key.toString())
      if (value === null) return defaultValue

      const decoded = decoder.decode(value)
      return decoded
    },

    async set(key, value) {
      const encoded = Buffer.from(encoder.encode(value))
      await redis.hset(options.key, key.toString(), encoded)
    },
  }

  return Object.freeze(proxy)
}
