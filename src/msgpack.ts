import { Decoder, Encoder } from '@msgpack/msgpack'
import { Buffer } from 'node:buffer'
import { promisify } from 'node:util'
import { gunzip as gunzipCb, gzip as gzipCb } from 'node:zlib'
import { codec as extensionCodecs } from './codecs.js'
import { nullsToUndefined } from './utils.js'

const gzip = promisify(gzipCb)
const gunzip = promisify(gunzipCb)

interface Codec {
  encode(object: unknown): Promise<Buffer>
  decode(buffer: Buffer): Promise<unknown>
}

export const createCodec = (level?: number) => {
  const compress = level !== undefined

  const encoder = new Encoder(extensionCodecs)
  const decoder = new Decoder(extensionCodecs)

  const codec: Codec = {
    async encode(object) {
      const encoded = encoder.encode(object)
      const buffer = Buffer.from(
        encoded.buffer,
        encoded.byteOffset,
        encoded.byteLength
      )

      if (compress) {
        const compressed = await gzip(buffer, { level })
        return compressed
      }

      return buffer
    },

    async decode(buffer) {
      const buf = compress ? await gunzip(buffer) : buffer
      const decoded = decoder.decode(buf)

      const transformed = nullsToUndefined(decoded)
      return transformed
    },
  }

  return Object.freeze(codec)
}
