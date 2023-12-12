import { basename } from 'node:path'
import { readFile } from 'node:fs/promises'
import type { PngOptions, ResizeOptions } from 'sharp'
import type {
  AppleDeviceSize,
  AppleSplashScreens,
  BuiltInPreset,
  Preset,
  ResolvedAppleSplashScreens,
  ResolvedAssets,
} from '../config.ts'
import {
  createAppleSplashScreens,
  createPngCompressionOptions,
  createResizeOptions,
  defaultAssetName,
  defaultPngCompressionOptions,
  defaultSplashScreenName,
  minimal2023Preset,
} from '../config.ts'
import { toResolvedAsset, toResolvedSize } from '../utils.ts'
import type { HtmlLinkPreset } from './html.ts'
import {
  createAppleSplashScreenHtmlLink,
  createAppleTouchIconHtmlLink,
  createFaviconHtmlLink,
} from './html.ts'
import type { ImageAssets, ImageAssetsInstructions, ImageSourceInput } from './types.ts'
import { generateTransparentAsset } from './transparent.ts'
import { generateMaskableAsset } from './maskable.ts'
import { generateFavicon } from './favicon.ts'

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

  resolveAppleSplashScreensInstructions(imageAssets, instructions, useAppleSplashScreens)

  return instructions
}

async function resolvePreset(preset: BuiltInPreset | Preset, faviconPreset?: HtmlLinkPreset): Promise<[Preset, HtmlLinkPreset]> {
  if (typeof preset === 'object')
    return [preset, faviconPreset ?? 'default']

  switch (preset) {
    case 'minimal':
      return [await import('../presets/minimal.ts').then(m => m.minimalPreset), 'default']
    case 'minimal-2023':
      return [await import('../presets/minimal-2023.ts').then(m => m.minimal2023Preset), '2023']
    default:
      throw new Error(`Preset ${preset} not yet implemented`)
  }
}

function resolveTransparentIcons(
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

function resolveMaskableIcons(
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

function resolveAppleSplashScreens(
  useAppleSplashScreens?: AppleSplashScreens,
) {
  let appleSplashScreens: ResolvedAppleSplashScreens | undefined
  if (useAppleSplashScreens) {
    const {
      padding = 0.3,
      resizeOptions: useResizeOptions = {},
      darkResizeOptions: useDarkResizeOptions = {},
      linkMediaOptions: useLinkMediaOptions = {},
      sizes,
      name = defaultSplashScreenName,
      png: usePng = {},
    } = useAppleSplashScreens

    // Initialize defaults
    const resizeOptions = createResizeOptions(false, useResizeOptions)
    const darkResizeOptions = createResizeOptions(true, useDarkResizeOptions)
    const png: PngOptions = createPngCompressionOptions(usePng)

    for (const size of sizes) {
      if (typeof size.padding === 'undefined')
        size.padding = padding

      if (typeof size.png === 'undefined')
        size.png = png

      if (typeof size.resizeOptions === 'undefined')
        size.resizeOptions = resizeOptions

      if (typeof size.darkResizeOptions === 'undefined')
        size.darkResizeOptions = darkResizeOptions
    }
    const {
      log = true,
      addMediaScreen = true,
      basePath = '/',
      xhtml = false,
    } = useLinkMediaOptions
    appleSplashScreens = {
      padding,
      sizes,
      linkMediaOptions: {
        log,
        addMediaScreen,
        basePath,
        xhtml,
      },
      name,
      png,
    }
  }

  return appleSplashScreens
}

interface SplashScreenData {
  size: AppleDeviceSize
  landscape: boolean
  dark?: boolean
  resizeOptions?: ResizeOptions
  padding: number
  png: PngOptions
}

function resolveAppleSplashScreensInstructions(
  imageAssets: ImageAssets,
  instructions: ImageAssetsInstructions,
  useAppleSplashScreens?: AppleSplashScreens,
) {
  const appleSplashScreens = resolveAppleSplashScreens(useAppleSplashScreens)
  if (!appleSplashScreens || !appleSplashScreens.sizes.length)
    return

  const { linkMediaOptions, name: resolveName, sizes, png } = appleSplashScreens

  const sizesMap = new Map<number, number>()
  const splashScreens: SplashScreenData[] = sizes.reduce((acc, size) => {
    // cleanup duplicates screen dimensions:
    // should we add the links (maybe scaleFactor is different)?
    if (sizesMap.get(size.width) === size.height)
      return acc

    sizesMap.set(size.width, size.height)
    const { width: height, height: width, ...restSize } = size
    const {
      width: lheight,
      height: lwidth,
      ...restResizeOptions
    } = size.resizeOptions || {}
    const landscapeSize: AppleDeviceSize = {
      ...restSize,
      width,
      height,
      resizeOptions: {
        ...restResizeOptions,
        width: lwidth,
        height: lheight,
      },
    }
    acc.push({
      size,
      landscape: false,
      dark: size.darkResizeOptions ? false : undefined,
      resizeOptions: size.resizeOptions,
      padding: size.padding ?? 0.3,
      png: size.png ?? png,
    })
    acc.push({
      size: landscapeSize,
      landscape: true,
      dark: size.darkResizeOptions ? false : undefined,
      resizeOptions: landscapeSize.resizeOptions,
      padding: size.padding ?? 0.3,
      png: size.png ?? png,
    })
    if (size.darkResizeOptions) {
      const {
        width: dlheight,
        height: dlwidth,
        ...restDarkResizeOptions
      } = size.darkResizeOptions
      const landscapeDarkResizeOptions: ResizeOptions = { ...restDarkResizeOptions, width: dlwidth, height: dlheight }
      const landscapeDarkSize: AppleDeviceSize = {
        ...restSize,
        width,
        height,
        resizeOptions: landscapeDarkResizeOptions,
        darkResizeOptions: undefined,
      }
      acc.push({
        size,
        landscape: false,
        dark: true,
        resizeOptions: size.darkResizeOptions,
        padding: size.padding ?? 0.3,
        png: size.png ?? png,
      })
      acc.push({
        size: landscapeDarkSize,
        landscape: true,
        dark: true,
        resizeOptions: landscapeDarkResizeOptions,
        padding: size.padding ?? 0.3,
        png: size.png ?? png,
      })
    }
    return acc
  }, [] as SplashScreenData[])

  sizesMap.clear()

  for (const size of splashScreens) {
    const name = resolveName(size.landscape, size.size, size.dark)
    const url = `${imageAssets.basePath}${name}`
    const promise = () => generateMaskableAsset('png', imageAssets.imageName, size.size, {
      padding: size.padding,
      resizeOptions: {
        ...size.resizeOptions,
        background: size.resizeOptions?.background ?? (size.dark ? 'black' : 'white'),
      },
      outputOptions: size.png,
    })
    instructions.appleSplashScreen[url] = {
      name,
      url,
      width: size.size.width,
      height: size.size.height,
      mimeType: 'image/png',
      link: createAppleSplashScreenHtmlLink('string', {
        size: size.size,
        landscape: size.landscape,
        addMediaScreen: linkMediaOptions.addMediaScreen,
        xhtml: linkMediaOptions.xhtml,
        name: resolveName,
        basePath: linkMediaOptions.basePath,
        dark: size.dark,
        includeId: imageAssets.htmlLinks.includeId,
      }),
      linkObject: createAppleSplashScreenHtmlLink('link', {
        size: size.size,
        landscape: size.landscape,
        addMediaScreen: linkMediaOptions.addMediaScreen,
        xhtml: linkMediaOptions.xhtml,
        name: resolveName,
        basePath: linkMediaOptions.basePath,
        dark: size.dark,
        includeId: imageAssets.htmlLinks.includeId,
      }),
      buffer: () => promise().then(m => m.toBuffer()),
    }
  }
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest
  describe('instructions', () => {
    it ('resolve instructions', async () => {
      const instructions = await resolveInstructions({
        imageResolver: () => readFile('playground/pwa/public/favicon.svg'),
        imageName: 'playground/pwa/public/favicon.svg',
        preset: 'minimal-2023',
        htmlLinks: {
          xhtml: false,
          includeId: false,
        },
        basePath: '/',
        resolveSvgName: name => basename(name),
      })
      expect(instructions).toMatchInlineSnapshot(`
        {
          "apple": {
            "/apple-touch-icon-180x180.png": {
              "buffer": [Function],
              "height": 180,
              "link": "<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">",
              "linkObject": {
                "href": "/apple-touch-icon-180x180.png",
                "id": "ati-180-180",
                "rel": "apple-touch-icon",
              },
              "mimeType": "image/png",
              "name": "apple-touch-icon-180x180.png",
              "url": "/apple-touch-icon-180x180.png",
              "width": 180,
            },
          },
          "appleSplashScreen": {},
          "favicon": {
            "/favicon.ico": {
              "buffer": [Function],
              "height": 48,
              "link": "<link rel="icon" href="/favicon.ico" sizes="48x48">",
              "linkObject": {
                "href": "/favicon.ico",
                "id": "fav-48x48",
                "rel": "icon",
                "sizes": "48x48",
              },
              "mimeType": "image/x-icon",
              "name": "favicon.ico",
              "url": "/favicon.ico",
              "width": 48,
            },
            "/favicon.svg": {
              "buffer": [Function],
              "height": 0,
              "link": "<link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml">",
              "linkObject": {
                "href": "/favicon.svg",
                "id": "fav-svg",
                "rel": "icon",
                "sizes": "any",
                "type": "image/svg+xml",
              },
              "mimeType": "image/svg+xml",
              "name": "favicon.svg",
              "url": "/favicon.svg",
              "width": 0,
            },
          },
          "image": "playground/pwa/public/favicon.svg",
          "maskable": {
            "/maskable-icon-512x512.png": {
              "buffer": [Function],
              "height": 512,
              "mimeType": "image/png",
              "name": "maskable-icon-512x512.png",
              "url": "/maskable-icon-512x512.png",
              "width": 512,
            },
          },
          "transparent": {
            "/pwa-192x192.png": {
              "buffer": [Function],
              "height": 192,
              "mimeType": "image/png",
              "name": "pwa-192x192.png",
              "url": "/pwa-192x192.png",
              "width": 192,
            },
            "/pwa-512x512.png": {
              "buffer": [Function],
              "height": 512,
              "mimeType": "image/png",
              "name": "pwa-512x512.png",
              "url": "/pwa-512x512.png",
              "width": 512,
            },
            "/pwa-64x64.png": {
              "buffer": [Function],
              "height": 64,
              "mimeType": "image/png",
              "name": "pwa-64x64.png",
              "url": "/pwa-64x64.png",
              "width": 64,
            },
          },
        }
      `)
    })
    it ('resolve instructions with apple splash screen icons', async () => {
      const instructions = await resolveInstructions({
        imageResolver: () => readFile('playground/pwa/public/favicon.svg'),
        imageName: 'playground/pwa/public/favicon.svg',
        faviconPreset: '2023',
        preset: {
          ...minimal2023Preset,
          appleSplashScreens: createAppleSplashScreens({
            padding: 0.3,
            resizeOptions: { fit: 'contain', background: 'white' },
            darkResizeOptions: { fit: 'contain', background: 'black' },
            linkMediaOptions: {
              log: true,
              addMediaScreen: true,
              basePath: '/',
              xhtml: true,
            },
          }, ['iPad Air 9.7"']),
        },
        htmlLinks: {
          xhtml: false,
          includeId: false,
        },
        basePath: '/',
        resolveSvgName: name => basename(name),
      })
      expect(instructions).toMatchInlineSnapshot(`
      {
        "apple": {
          "/apple-touch-icon-180x180.png": {
            "buffer": [Function],
            "height": 180,
            "link": "<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">",
            "linkObject": {
              "href": "/apple-touch-icon-180x180.png",
              "id": "ati-180-180",
              "rel": "apple-touch-icon",
            },
            "mimeType": "image/png",
            "name": "apple-touch-icon-180x180.png",
            "url": "/apple-touch-icon-180x180.png",
            "width": 180,
          },
        },
        "appleSplashScreen": {
          "/apple-splash-landscape-dark-2048x1536.png": {
            "buffer": [Function],
            "height": 1536,
            "link": "<link rel="apple-touch-startup-image" media="screen and (prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" href="/apple-splash-landscape-dark-2048x1536.png" />",
            "linkObject": {
              "href": "/apple-splash-landscape-dark-2048x1536.png",
              "id": "atsi-1536-2048-2-dark",
              "media": "screen and (prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
              "rel": "apple-touch-startup-image",
            },
            "mimeType": "image/png",
            "name": "apple-splash-landscape-dark-2048x1536.png",
            "url": "/apple-splash-landscape-dark-2048x1536.png",
            "width": 2048,
          },
          "/apple-splash-landscape-light-2048x1536.png": {
            "buffer": [Function],
            "height": 1536,
            "link": "<link rel="apple-touch-startup-image" media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" href="/apple-splash-landscape-light-2048x1536.png" />",
            "linkObject": {
              "href": "/apple-splash-landscape-light-2048x1536.png",
              "id": "atsi-1536-2048-2-light",
              "media": "screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
              "rel": "apple-touch-startup-image",
            },
            "mimeType": "image/png",
            "name": "apple-splash-landscape-light-2048x1536.png",
            "url": "/apple-splash-landscape-light-2048x1536.png",
            "width": 2048,
          },
          "/apple-splash-portrait-dark-1536x2048.png": {
            "buffer": [Function],
            "height": 2048,
            "link": "<link rel="apple-touch-startup-image" media="screen and (prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/apple-splash-portrait-dark-1536x2048.png" />",
            "linkObject": {
              "href": "/apple-splash-portrait-dark-1536x2048.png",
              "id": "atsi-1536-2048-2-dark",
              "media": "screen and (prefers-color-scheme: dark) and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
              "rel": "apple-touch-startup-image",
            },
            "mimeType": "image/png",
            "name": "apple-splash-portrait-dark-1536x2048.png",
            "url": "/apple-splash-portrait-dark-1536x2048.png",
            "width": 1536,
          },
          "/apple-splash-portrait-light-1536x2048.png": {
            "buffer": [Function],
            "height": 2048,
            "link": "<link rel="apple-touch-startup-image" media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/apple-splash-portrait-light-1536x2048.png" />",
            "linkObject": {
              "href": "/apple-splash-portrait-light-1536x2048.png",
              "id": "atsi-1536-2048-2-light",
              "media": "screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
              "rel": "apple-touch-startup-image",
            },
            "mimeType": "image/png",
            "name": "apple-splash-portrait-light-1536x2048.png",
            "url": "/apple-splash-portrait-light-1536x2048.png",
            "width": 1536,
          },
        },
        "favicon": {
          "/favicon.ico": {
            "buffer": [Function],
            "height": 48,
            "link": "<link rel="icon" href="/favicon.ico" sizes="48x48">",
            "linkObject": {
              "href": "/favicon.ico",
              "id": "fav-48x48",
              "rel": "icon",
              "sizes": "48x48",
            },
            "mimeType": "image/x-icon",
            "name": "favicon.ico",
            "url": "/favicon.ico",
            "width": 48,
          },
          "/favicon.svg": {
            "buffer": [Function],
            "height": 0,
            "link": "<link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml">",
            "linkObject": {
              "href": "/favicon.svg",
              "id": "fav-svg",
              "rel": "icon",
              "sizes": "any",
              "type": "image/svg+xml",
            },
            "mimeType": "image/svg+xml",
            "name": "favicon.svg",
            "url": "/favicon.svg",
            "width": 0,
          },
        },
        "image": "playground/pwa/public/favicon.svg",
        "maskable": {
          "/maskable-icon-512x512.png": {
            "buffer": [Function],
            "height": 512,
            "mimeType": "image/png",
            "name": "maskable-icon-512x512.png",
            "url": "/maskable-icon-512x512.png",
            "width": 512,
          },
        },
        "transparent": {
          "/pwa-192x192.png": {
            "buffer": [Function],
            "height": 192,
            "mimeType": "image/png",
            "name": "pwa-192x192.png",
            "url": "/pwa-192x192.png",
            "width": 192,
          },
          "/pwa-512x512.png": {
            "buffer": [Function],
            "height": 512,
            "mimeType": "image/png",
            "name": "pwa-512x512.png",
            "url": "/pwa-512x512.png",
            "width": 512,
          },
          "/pwa-64x64.png": {
            "buffer": [Function],
            "height": 64,
            "mimeType": "image/png",
            "name": "pwa-64x64.png",
            "url": "/pwa-64x64.png",
            "width": 64,
          },
        },
      }
    `)
    })
  })
}
