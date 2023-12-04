import type { ResolvedAssetSize } from '../types.ts'

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
