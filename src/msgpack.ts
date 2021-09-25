import { Decoder, Encoder } from '@msgpack/msgpack'
import { Buffer } from 'node:buffer'
import { promisify } from 'node:util'
import { gunzip as gunzipCb, gzip as gzipCb } from 'node:zlib'
import { codec as extensionCodecs } from './codecs.js'

const gzip = promisify(gzipCb)
const gunzip = promisify(gunzipCb)

interface Codec {
  encode(object: unknown): Promise<Buffer>
  decode(buffer: Buffer): Promise<unknown>
}

export const createCodec = (compress = false) => {
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
        const compressed = await gzip(buffer)
        return compressed
      }

      return buffer
    },

    async decode(buffer) {
      if (compress) {
        const decomp = await gunzip(buffer)
        return decoder.decode(decomp)
      }

      return decoder.decode(buffer)
    },
  }

  return Object.freeze(codec)
}
