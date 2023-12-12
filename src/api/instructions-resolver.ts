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
  createPngCompressionOptions,
  createResizeOptions,
  defaultAssetName,
  defaultPngCompressionOptions,
  defaultSplashScreenName,
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
