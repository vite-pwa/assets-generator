import type { ResolvedAssets } from '../types.ts'
import { toResolvedSize } from '../utils.ts'
import type { ImageAssets, ImageAssetsInstructions, ImageSourceInput } from './types.ts'
import type { HtmlLinkPreset } from './html.ts'
import { createAppleTouchIconHtmlLink, createFaviconHtmlLink } from './html.ts'
import { generateTransparentAsset } from './transparent.ts'
import { generateFavicon } from './favicon.ts'
import { generateMaskableAsset } from './maskable.ts'

export function resolveTransparentIcons(
  imageAssets: ImageAssets,
  image: ImageSourceInput,
  assets: ResolvedAssets,
  htmlPreset: HtmlLinkPreset,
  instructions: ImageAssetsInstructions,
) {
  const asset = assets.assets.transparent
  const { sizes, padding, resizeOptions } = asset
  const { basePath, htmlLinks: { xhtml, includeId } } = imageAssets
  for (const size of sizes) {
    const name = assets.assetName('transparent', size)
    const url = `${basePath}${name}`
    const promise = () => generateTransparentAsset('png', image, size, {
      padding,
      resizeOptions,
      outputOptions: assets.png,
    })
    instructions.transparent[url] = {
      name,
      url,
      width: size.width,
      height: size.height,
      mimeType: 'image/png',
      buffer: () => promise().then(m => m.toBuffer()),
    }
  }

  const favicons = asset.favicons
  if (!favicons)
    return

  for (const [size, name] of favicons) {
    const url = `${basePath}${name}`
    const promise = () => generateTransparentAsset('png', image, size, {
      padding,
      resizeOptions,
      outputOptions: assets.png,
    }).then(m => m.toBuffer())
      .then(b => generateFavicon('png', b))
    const resolvedSize = toResolvedSize(size)
    instructions.favicon[url] = {
      name,
      url,
      width: resolvedSize.width,
      height: resolvedSize.height,
      mimeType: 'image/x-icon',
      link: createFaviconHtmlLink('string', htmlPreset, {
        name,
        size,
        basePath,
        xhtml,
        includeId,
      }),
      linkObject: createFaviconHtmlLink('link', htmlPreset, {
        name,
        size,
        basePath,
        xhtml,
        includeId,
      }),
      buffer: () => promise(),
    }
  }
}

export function resolveMaskableIcons(
  type: 'apple' | 'maskable',
  imageAssets: ImageAssets,
  image: ImageSourceInput,
  assets: ResolvedAssets,
  htmlPreset: HtmlLinkPreset,
  instructions: ImageAssetsInstructions,
) {
  const asset = assets.assets[type]
  const { sizes, padding, resizeOptions } = asset
  const { basePath, htmlLinks: { xhtml, includeId } } = imageAssets
  for (const size of sizes) {
    const name = assets.assetName(type, size)
    const url = `${basePath}${name}`
    const promise = () => generateMaskableAsset('png', image, size, {
      padding,
      resizeOptions,
      outputOptions: assets.png,
    })
    const buffer = () => promise().then(m => m.toBuffer())
    if (type === 'apple') {
      instructions.apple[url] = {
        name,
        url,
        width: size.width,
        height: size.height,
        mimeType: 'image/png',
        link: createAppleTouchIconHtmlLink('string', {
          name,
          size,
          basePath,
          xhtml,
          includeId,
        }),
        linkObject: createAppleTouchIconHtmlLink('link', {
          name,
          size,
          basePath,
          xhtml,
          includeId,
        }),
        buffer,
      }
    }
    else {
      instructions.maskable[url] = {
        name,
        url,
        width: size.width,
        height: size.height,
        mimeType: 'image/png',
        buffer,
      }
    }
  }

  const favicons = asset.favicons
  if (!favicons)
    return

  for (const [size, name] of favicons) {
    const url = `${basePath}${name}`
    const resolvedSize = toResolvedSize(size)
    instructions.favicon[url] = {
      name,
      url,
      width: resolvedSize.width,
      height: resolvedSize.height,
      mimeType: 'image/x-icon',
      link: createFaviconHtmlLink('string', htmlPreset, {
        name,
        size,
        basePath,
        xhtml,
        includeId,
      }),
      linkObject: createFaviconHtmlLink('link', htmlPreset, {
        name,
        size,
        basePath,
        xhtml,
        includeId,
      }),
      buffer: () => generateMaskableAsset('png', image, size, {
        padding,
        resizeOptions,
        outputOptions: assets.png,
      }).then(m => m.toBuffer()).then(b => generateFavicon('png', b)),
    }
  }
}
