import type {
  BuiltInPreset,
  Preset,
  ResolvedAssets,
} from '../config.ts'
import {
  defaultAssetName,
  defaultPngCompressionOptions,
} from '../config.ts'
import { toResolvedAsset } from '../utils.ts'
import type { HtmlLinkPreset } from './html.ts'
import {
  createFaviconHtmlLink,
} from './html.ts'
import type { ImageAssets, ImageAssetsInstructions } from './types.ts'
import { resolveAppleSplashScreensInstructions } from './apple-icons-helper.ts'
import { resolveMaskableIcons, resolveTransparentIcons } from './icons-resolver-helper.ts'

export async function resolveInstructions(imageAssets: ImageAssets) {
  const {
    imageResolver,
    imageName,
    originalName,
    preset = 'minimal',
    faviconPreset,
  } = imageAssets

  const [usePreset, htmlPreset] = await resolvePreset(preset, faviconPreset)

  const {
    assetName = defaultAssetName,
    png = defaultPngCompressionOptions,
    appleSplashScreens: useAppleSplashScreens,
  } = usePreset

  const assets: ResolvedAssets = {
    assets: {
      transparent: toResolvedAsset('transparent', usePreset.transparent),
      maskable: toResolvedAsset('maskable', usePreset.maskable),
      apple: toResolvedAsset('apple', usePreset.apple),
    },
    png,
    assetName,
  }

  const instructions = {
    image: imageName,
    originalName,
    favicon: {},
    transparent: {},
    maskable: {},
    apple: {},
    appleSplashScreen: {},
  } as ImageAssetsInstructions

  const image = await imageResolver()

  resolveTransparentIcons(imageAssets, image, assets, htmlPreset, instructions)
  resolveMaskableIcons('maskable', imageAssets, image, assets, htmlPreset, instructions)
  resolveMaskableIcons('apple', imageAssets, image, assets, htmlPreset, instructions)

  if (imageName.endsWith('.svg')) {
    const name = imageAssets.resolveSvgName(imageName)
    const url = `${imageAssets.basePath}${name}`
    instructions.favicon[url] = {
      name,
      url,
      width: 0,
      height: 0,
      mimeType: 'image/svg+xml',
      link: createFaviconHtmlLink('string', htmlPreset, {
        name,
        basePath: imageAssets.basePath,
        xhtml: imageAssets.htmlLinks.xhtml,
        includeId: imageAssets.htmlLinks.includeId,
      }),
      linkObject: createFaviconHtmlLink('link', htmlPreset, {
        name,
        basePath: imageAssets.basePath,
        xhtml: imageAssets.htmlLinks.xhtml,
        includeId: imageAssets.htmlLinks.includeId,
      }),
      buffer: () => Promise.resolve(image),
    }
  }

  resolveAppleSplashScreensInstructions(image, imageAssets, instructions, useAppleSplashScreens)

  return instructions
}

async function resolvePreset(
  preset: BuiltInPreset | Preset,
  faviconPreset?: HtmlLinkPreset,
): Promise<[preset: Preset, htmlLinkPreset: HtmlLinkPreset]> {
  const htmlLinkPreset = faviconPreset ?? 'default'
  if (typeof preset === 'object')
    return [preset, htmlLinkPreset]

  switch (preset) {
    case 'minimal':
      return [await import('../presets/minimal.ts').then(m => m.minimalPreset), htmlLinkPreset]
    case 'minimal-2023':
      return [await import('../presets/minimal-2023.ts').then(m => m.minimal2023Preset), htmlLinkPreset]
    default:
      throw new Error(`Preset ${preset} not yet implemented`)
  }
}
