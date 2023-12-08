import sharp from 'sharp'
import { encode } from 'sharp-ico'
import type { GenerateFaviconOptionsType, GenerateFaviconType, ImageSourceInput } from './types.ts'

export async function generateFavicon<Format extends GenerateFaviconType>(
  format: Format,
  image: ImageSourceInput,
  options?: GenerateFaviconOptionsType<Format>,
) {
  return encode([await sharp(image).toFormat(format, options).toBuffer()])
}
