import sharp from 'sharp'
import type { PngOptions, WebpOptions } from 'sharp'
import type { AssetSize } from '../types.ts'
import { toResolvedSize } from '../utils.ts'
import type { ImageSourceInput } from './types.ts'
import { extractAssetSize } from './utils.ts'

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
export async function generateTransparentAsset<OutputType extends GenerateOptionsType>(
  type: OutputType,
  image: ImageSourceInput,
  size: AssetSize,
  options?: GenerateOptionsOptionType<OutputType>,
) {
  const {
    padding = 0,
    resizeOptions,
  } = options ?? {}
  const useSize = toResolvedSize(size)
  const { width, height } = extractAssetSize(useSize, padding)
  const result = sharp({
    create: {
      width: useSize.width,
      height: useSize.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{
    input: await sharp(image)
      .resize(
        width,
        height,
        resizeOptions,
      ).toBuffer(),
  }])

  if (type === 'none' || !options)
    return result

  return type === 'png'
    ? result.png(options.outputOptions as PngOptions)
    : result.webp(options.outputOptions as WebpOptions)
}

if (import.meta.vitest) {
  const { expect, it } = import.meta.vitest
  it('should generate a transparent asset', async () => {
    const result = await generateTransparentAsset(
      'png',
      'playground/pwa/public/favicon.svg',
      512, {
        padding: 0.1,
        resizeOptions: { fit: 'contain' },
        outputOptions: { compressionLevel: 9, quality: 60 },
      },
    )
    expect(result).toBeDefined()
  })
}
