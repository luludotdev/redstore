/* eslint-disable @typescript-eslint/ban-types */
import { decode, encode, ExtensionCodec } from '@msgpack/msgpack'

const codec = new ExtensionCodec()
const enum CodecType {
  Set = 0,
  Map = 1,
  BigInt = 2,
}

// Set<T>
codec.register({
  type: CodecType.Set,
  encode(object: unknown): Uint8Array | null {
    if (object instanceof Set) {
      return encode([...object])
    }

    return null
  },
  decode(data: Uint8Array) {
    const array = decode(data) as unknown[]
    return new Set(array)
  },
})

// Map<K, V>
codec.register({
  type: CodecType.Map,
  encode(object: unknown): Uint8Array | null {
    if (object instanceof Map) {
      return encode([...object])
    }

    return null
  },
  decode(data: Uint8Array) {
    const array = decode(data) as [unknown, unknown][]
    return new Map(array)
  },
})

// BigInt
codec.register({
  type: CodecType.BigInt,
  encode(input: unknown) {
    if (typeof input === 'bigint') {
      if (
        input <= Number.MAX_SAFE_INTEGER &&
        input >= Number.MIN_SAFE_INTEGER
      ) {
        return encode(Number.parseInt(input.toString(), 10))
      }

      return encode(input.toString())
    }

    return null
  },
  decode(data: Uint8Array) {
    const decoded = decode(data)
    if (typeof decoded === 'string') return BigInt(decoded)
    if (typeof decoded === 'number') return BigInt(decoded)

    throw new TypeError('Invalid Bigint')
  },
})

export { codec }
