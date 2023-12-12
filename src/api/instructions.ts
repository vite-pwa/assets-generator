import type { ImageAssets } from './types.ts'

export async function instructions(imageAssets: ImageAssets) {
  return await import('./instructions-resolver.ts').then(({ resolveInstructions }) => resolveInstructions(imageAssets))
}
