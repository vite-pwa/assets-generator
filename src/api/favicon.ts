import type { GenerateFaviconOptionsType, GenerateFaviconType, ImageSourceInput } from './types.ts'
import sharp from 'sharp'
import { encode } from 'sharp-ico'

export async function generateFavicon<Format extends GenerateFaviconType>(
  format: Format,
  image: ImageSourceInput,
  options?: GenerateFaviconOptionsType<Format>,
) {
  return encode([await sharp(image).toFormat(format, options).toBuffer()])
}

if (import.meta.vitest) {
  const { expect, it } = import.meta.vitest
  it('should generate a favicon asset', async () => {
    const result = await generateFavicon(
      'png',
      'playground/pwa/public/favicon.svg',
    )
    expect(result).toBeDefined()
  })
}
