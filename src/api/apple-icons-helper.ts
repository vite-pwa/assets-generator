import type { PngOptions, ResizeOptions } from 'sharp'
import type { AppleDeviceSize, AppleSplashScreens, ResolvedAppleSplashScreens } from '../types.ts'
import { defaultSplashScreenName } from '../splash.ts'
import { createPngCompressionOptions, createResizeOptions } from './defaults.ts'
import type { ImageAssets, ImageAssetsInstructions } from './types.ts'
import { generateMaskableAsset } from './maskable.ts'
import { createAppleSplashScreenHtmlLink } from './html.ts'

export function resolveAppleSplashScreensInstructions(
  // eslint-disable-next-line n/prefer-global/buffer
  image: Buffer,
  imageAssets: ImageAssets,
  instructions: ImageAssetsInstructions,
  useAppleSplashScreens?: AppleSplashScreens,
) {
  const appleSplashScreens = resolveAppleSplashScreens(
    imageAssets,
    useAppleSplashScreens,
  )
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

  // eslint-disable-next-line n/prefer-global/buffer
  const cache: Record<string, Promise<Buffer>> = {}
  const originalName = imageAssets.originalName!

  // eslint-disable-next-line n/prefer-global/buffer
  const imageResolver = (dark: boolean): Promise<Buffer> => {
    if (!dark || typeof appleSplashScreens.darkImageResolver !== 'function')
      return Promise.resolve(image)

    const cached = cache[originalName]
    if (cached)
      return cached

    return cache[originalName] = appleSplashScreens
      .darkImageResolver(originalName)
      .then(darkImage => Promise.resolve(darkImage ?? image))
  }

  for (const size of splashScreens) {
    const name = resolveName(size.landscape, size.size, size.dark)
    const url = `${imageAssets.basePath}${name}`
    const promise = () => imageResolver(size.dark === true).then(i => generateMaskableAsset('png', i, size.size, {
      padding: size.padding,
      resizeOptions: {
        ...size.resizeOptions,
        background: size.resizeOptions?.background ?? (size.dark ? 'black' : 'white'),
      },
      outputOptions: size.png,
    }))

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

interface SplashScreenData {
  size: AppleDeviceSize
  landscape: boolean
  dark?: boolean
  resizeOptions?: ResizeOptions
  padding: number
  png: PngOptions
}

function resolveAppleSplashScreens(
  imageAssets: ImageAssets,
  useAppleSplashScreens?: AppleSplashScreens,
) {
  let appleSplashScreens: ResolvedAppleSplashScreens | undefined
  if (useAppleSplashScreens) {
    const {
      padding = 0.3,
      resizeOptions: useResizeOptions = {},
      darkResizeOptions: useDarkResizeOptions,
      linkMediaOptions: useLinkMediaOptions = {},
      sizes,
      name = defaultSplashScreenName,
      png: usePng = {},
      darkImageResolver,
    } = useAppleSplashScreens

    // Initialize defaults
    const resizeOptions = createResizeOptions(false, useResizeOptions)
    const darkResizeOptions = useDarkResizeOptions ? createResizeOptions(true, useDarkResizeOptions) : undefined
    const png: PngOptions = createPngCompressionOptions(usePng)

    for (const size of sizes) {
      if (typeof size.padding === 'undefined')
        size.padding = padding

      if (typeof size.png === 'undefined')
        size.png = png

      if (typeof size.resizeOptions === 'undefined')
        size.resizeOptions = resizeOptions

      if (typeof size.darkResizeOptions === 'undefined' && darkResizeOptions)
        size.darkResizeOptions = darkResizeOptions
    }
    const {
      log = true,
      addMediaScreen = true,
      basePath = imageAssets.basePath ?? '/',
      xhtml = false,
    } = useLinkMediaOptions
    appleSplashScreens = {
      darkImageResolver,
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
