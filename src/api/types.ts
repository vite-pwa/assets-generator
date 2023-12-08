import type sharp from 'sharp'
import { type PngOptions, type WebpOptions } from 'sharp'

export type ImageSourceInput =
    // eslint-disable-next-line n/prefer-global/buffer
    | Buffer
    | ArrayBuffer
    | Uint8Array
    | Uint8ClampedArray
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    | string

export interface GenerateOptions {
  /**
   * @default 0
   */
  padding?: number
  outputOptions?: any
  resizeOptions?: sharp.ResizeOptions
}
export type GenerateOptionsType = 'png' | 'webp' | 'none'
export type GenerateOptionsOptionType<T> =
    T extends 'png' ? GenerateOutputOptions<PngOptions> :
      T extends 'webp' ? GenerateOutputOptions<WebpOptions> :
        T extends 'none' ? GenerateOptions :
          never

export interface GenerateOutputOptions<T> extends GenerateOptions {
  outputOptions: T
}
