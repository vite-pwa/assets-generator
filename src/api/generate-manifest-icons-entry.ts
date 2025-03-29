import type { ImageAssetsInstructions, ManifestIcons, ManifestIconsOptionsType, ManifestIconsType } from './types.ts'

export function generateManifestIconsEntry<Format extends ManifestIconsType>(
  format: Format,
  instruction: ImageAssetsInstructions,
): ManifestIconsOptionsType<Format> {
  const icons: ManifestIcons = { icons: [] }

  for (const icon of Object.values(instruction.transparent)) {
    icons.icons.push({
      src: icon.url,
      sizes: `${icon.width}x${icon.height}`,
      type: icon.mimeType,
    })
  }
  for (const icon of Object.values(instruction.maskable)) {
    icons.icons.push({
      src: icon.url,
      sizes: `${icon.width}x${icon.height}`,
      type: icon.mimeType,
      purpose: 'maskable',
    })
  }

  return (
    format === 'string'
      ? JSON.stringify(icons, null, 2)
      : icons
  ) as ManifestIconsOptionsType<Format>
}
