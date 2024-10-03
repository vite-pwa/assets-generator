import type { AssetSize, ResolvedAssetSize } from '../types.ts'
import type { GenerateOptionsOptionType, GenerateOptionsType, ImageSourceInput } from './types.ts'
import sharp, { type PngOptions, type WebpOptions } from 'sharp'
import { toResolvedSize } from '../utils.ts'

export function extractAssetSize(size: ResolvedAssetSize, padding: number) {
  const width = typeof size.original === 'number'
    ? size.original
    : size.original.width
  const height = typeof size.original === 'number'
    ? size.original
    : size.original.height

  return {
    width: Math.round(width * (1 - padding)),
    height: Math.round(height * (1 - padding)),
  }
}

export async function createSharp<OutputType extends GenerateOptionsType>(
  type: OutputType,
  image: ImageSourceInput,
  size: AssetSize,
  background: sharp.Color,
  options?: GenerateOptionsOptionType<OutputType>,
  channels?: sharp.Channels,
) {
  const { padding = 0 } = options ?? {}
  const useSize = toResolvedSize(size)
  const { width, height } = extractAssetSize(useSize, padding)
  const result = sharp({
    create: {
      width: useSize.width,
      height: useSize.height,
      channels: channels ?? 4,
      background,
    },
  }).composite([{
    input: await sharp(image)
      .resize(
        width,
        height,
        options?.resizeOptions,
      )
      .toBuffer(),
  }])

  if (type === 'none' || !options)
    return result

  return type === 'png'
    ? result.png(options.outputOptions as PngOptions)
    : result.webp(options.outputOptions as WebpOptions)
}
