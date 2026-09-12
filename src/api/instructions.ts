import type { ImageAssets, ImageAssetsInstructions } from './types.ts'

export async function instructions(
  imageAssets: ImageAssets,
): Promise<ImageAssetsInstructions> {
  return await import('./instructions-resolver.ts').then(({ resolveInstructions }) => resolveInstructions(imageAssets))
}
