import type { AssetSize } from '../types.ts'
import type { GenerateOptionsOptionType, GenerateOptionsType, ImageSourceInput } from './types.ts'
import { createSharp } from './utils.ts'

export async function generateTransparentAsset<OutputType extends GenerateOptionsType>(
  type: OutputType,
  image: ImageSourceInput,
  size: AssetSize,
  options?: GenerateOptionsOptionType<OutputType>,
) {
  return await createSharp<OutputType>(
    type,
    image,
    size,
    { r: 0, g: 0, b: 0, alpha: 0 },
    options,
    4,
  )
}

if (import.meta.vitest) {
  const { expect, it } = import.meta.vitest
  it('should generate a transparent asset', async () => {
    const result = await generateTransparentAsset(
      'png',
      'playground/pwa/public/favicon.svg',
      512,
      {
        padding: 0.1,
        resizeOptions: { fit: 'contain' },
        outputOptions: { compressionLevel: 9, quality: 60 },
      },
    )
    expect(result).toBeDefined()
  })
}
