import { Decoder, Encoder } from '@msgpack/msgpack'
import { Buffer } from 'node:buffer'
import { codec as extensionCodecs } from './codecs.js'

interface Codec {
  encode(object: unknown): Buffer
  decode(buffer: ArrayLike<number> | BufferSource): unknown
}

export const createCodec = (compress = false) => {
  const encoder = new Encoder(extensionCodecs)
  const decoder = new Decoder(extensionCodecs)

  const codec: Codec = {
    encode(object) {
      const encoded = encoder.encode(object)
      const buffer = Buffer.from(
        encoded.buffer,
        encoded.byteOffset,
        encoded.byteLength
      )

      return buffer
    },

    decode(buffer) {
      return decoder.decode(buffer)
    },
  }

  return Object.freeze(codec)
}
