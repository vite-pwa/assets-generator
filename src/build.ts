import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { consola } from 'consola'
import { green, yellow } from 'colorette'
import type { PngOptions, ResizeOptions } from 'sharp'
import sharp from 'sharp'
import { encode } from 'sharp-ico'
import type {
  AppleDeviceSize,
  AssetType,
  Favicon,
  ResolvedAppleSplashScreens,
  ResolvedAssetSize,
  ResolvedAssets,
  ResolvedBuildOptions,
} from './types.ts'
import {
  cloneResolvedAssetsSizes,
  defaultAssetName,
  defaultPngCompressionOptions,
  defaultPngOptions,
  sameAssetSize,
  toResolvedAsset,
  toResolvedSize,
} from './utils.ts'
import { createAppleSplashScreenHtmlLink } from './splash.ts'

export * from './types'
export { defaultAssetName, defaultPngCompressionOptions, defaultPngOptions, toResolvedAsset }

export async function generatePWAImageAssets(
  buildOptions: ResolvedBuildOptions,
  image: string,
  assets: ResolvedAssets,
  appleSplashScreens?: ResolvedAppleSplashScreens,
) {
  const imagePath = resolve(buildOptions.root, image)
  const folder = dirname(imagePath)

  const pngFilesToDelete: string[] = []

  const newAssets = collectMissingFavicons(assets, pngFilesToDelete, folder)

  await Promise.all([
    generateTransparentAssets(buildOptions, newAssets, imagePath, folder),
    generateMaskableAssets('maskable', buildOptions, newAssets, imagePath, folder),
    generateMaskableAssets('apple', buildOptions, newAssets, imagePath, folder),
  ])

  if (pngFilesToDelete.length) {
    consola.start('Deleting unused PNG files')
    await Promise.all(pngFilesToDelete.map((png) => {
      consola.ready(green(`Deleting PNG file: ${png}`))
      return rm(png, { force: true })
    }))
    consola.ready('Unused PNG files deleted')
  }

  if (appleSplashScreens && appleSplashScreens.sizes.length) {
    const appleLinks: string[] = []
    consola.start('Generating Apple Splash Screens...')
    await generateAppleSplashScreens(buildOptions, appleSplashScreens, imagePath, folder, appleLinks)
    if (buildOptions.logLevel !== 'silent' && appleLinks.length && appleSplashScreens.linkMediaOptions.log) {
      consola.start('Apple Splash Screens Links:')
      // eslint-disable-next-line no-console
      appleLinks.forEach(link => console.log(link))
    }
    consola.ready('Apple Splash Screens generated')
  }
}

export async function generatePWAAssets(
  images: string[],
  assets: ResolvedAssets,
  buildOptions: ResolvedBuildOptions,
  appleSplashScreens?: ResolvedAppleSplashScreens,
) {
  for (const image of images)
    await generatePWAImageAssets(buildOptions, image, assets, appleSplashScreens)
}

function collectMissingFavicons(
  resolvedAssets: ResolvedAssets,
  pngFilesToDelete: string[],
  folder: string,
) {
  const missingFavicons = new Map<AssetType, Favicon[]>()
  const newAssets = cloneResolvedAssetsSizes(resolvedAssets)
  // generate missing favicon icons
  Object.entries(newAssets.assets).forEach(([type, asset]) => {
    const favicons = asset.favicons
    if (!favicons)
      return

    const entriesToAdd: ResolvedAssetSize[] = []

    favicons.forEach(([size, name]) => {
      const generate = !asset.sizes.some(s => sameAssetSize(size, s))
      if (generate) {
        const resolvedSize = toResolvedSize(size)
        entriesToAdd.push(resolvedSize)
        pngFilesToDelete.push(resolve(folder, newAssets.assetName(type as AssetType, resolvedSize)))
        let entry = missingFavicons.get(type as AssetType)
        if (!entry) {
          entry = []
          missingFavicons.set(type as AssetType, entry)
        }
        entry.push([size, name])
      }
    })

    if (entriesToAdd.length)
      asset.sizes.push(...entriesToAdd)
  })

  return newAssets
}

async function generateFavicon(
  buildOptions: ResolvedBuildOptions,
  folder: string,
  type: AssetType,
  assets: ResolvedAssets,
  assetSize: ResolvedAssetSize,
) {
  const asset = assets.assets[type]
  const favicons = asset?.favicons?.filter(([size]) => sameAssetSize(size, assetSize))
  if (!favicons)
    return

  await Promise.all(favicons.map(async ([_size, name]) => {
    const favicon = resolve(folder, name)
    if (!buildOptions.overrideAssets && existsSync(favicon)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping, ICO file already exists: ${favicon}`))

      return
    }

    const png = resolve(folder, assets.assetName(type, assetSize))
    if (!existsSync(png)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping: ${favicon}, missing PNG source file: ${png}`))

      return
    }

    const pngBuffer = await sharp(png).toFormat('png').toBuffer()
    await writeFile(favicon, encode([pngBuffer]))

    if (buildOptions.logLevel !== 'silent')
      consola.ready(green(`Generated ICO file: ${favicon}`))
  }))
}

function extractAssetSize(size: ResolvedAssetSize, padding: number) {
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

function extractAppleDeviceSize(size: AppleDeviceSize, padding: number) {
  return {
    width: Math.round(size.width * (1 - padding)),
    height: Math.round(size.height * (1 - padding)),
  }
}

async function optimizePng(filePath: string, png: PngOptions) {
  try {
    await sharp(filePath).png(png).toFile(`${filePath.replace(/-temp\.png$/, '.png')}`)
  }
  finally {
    await rm(filePath, { force: true })
  }
}

async function resolveTempPngAssetName(name: string) {
  await mkdir(dirname(name), { recursive: true })
  return name.replace(/\.png$/, '-temp.png')
}

async function generateTransparentAssets(
  buildOptions: ResolvedBuildOptions,
  assets: ResolvedAssets,
  image: string,
  folder: string,
) {
  const asset = assets.assets.transparent
  const { sizes, padding, resizeOptions } = asset
  await Promise.all(sizes.map(async (size) => {
    let filePath = resolve(folder, assets.assetName('transparent', size))
    if (!buildOptions.overrideAssets && existsSync(filePath)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping, PNG file already exists: ${filePath}`))

      return
    }

    filePath = await resolveTempPngAssetName(filePath)
    const { width, height } = extractAssetSize(size, padding)
    await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).composite([{
      input: await sharp(image)
        .resize(
          width,
          height,
          resizeOptions,
        ).toBuffer(),
    }]).toFile(filePath)
    await optimizePng(filePath, assets.png)
    if (buildOptions.logLevel !== 'silent')
      consola.ready(green(`Generated PNG file: ${filePath.replace(/-temp\.png$/, '.png')}`))

    await generateFavicon(buildOptions, folder, 'transparent', assets, size)
  }))
}

async function generateMaskableAssets(
  type: AssetType,
  buildOptions: ResolvedBuildOptions,
  assets: ResolvedAssets,
  image: string,
  folder: string,
) {
  const asset = assets.assets[type]
  const { sizes, padding, resizeOptions } = asset
  await Promise.all(sizes.map(async (size) => {
    let filePath = resolve(folder, assets.assetName(type, size))
    if (!buildOptions.overrideAssets && existsSync(filePath)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping, PNG file already exists: ${filePath}`))

      return
    }

    filePath = await resolveTempPngAssetName(filePath)
    const { width, height } = extractAssetSize(size, padding)
    await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: resizeOptions?.background ?? 'white',
      },
    }).composite([{
      input: await sharp(image)
        .resize(
          width,
          height,
          resizeOptions,
        ).toBuffer(),
    }]).toFile(filePath)
    await optimizePng(filePath, assets.png)
    if (buildOptions.logLevel !== 'silent')
      consola.ready(green(`Generated PNG file: ${filePath.replace(/-temp\.png$/, '.png')}`))

    await generateFavicon(buildOptions, folder, type, assets, size)
  }))
}

interface SplashScreenData {
  size: AppleDeviceSize
  landscape: boolean
  dark?: boolean
  resizeOptions?: ResizeOptions
  padding: number
  png: PngOptions
}

async function generateAppleSplashScreens(
  buildOptions: ResolvedBuildOptions,
  { linkMediaOptions, name, sizes, png }: ResolvedAppleSplashScreens,
  image: string,
  folder: string,
  links: string[],
) {
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

  await Promise.all(splashScreens.map(async (size) => {
    let filePath = resolve(folder, name(size.landscape, size.size, size.dark))
    if (!buildOptions.overrideAssets && existsSync(filePath)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping, PNG file already exists: ${filePath}`))

      return
    }

    filePath = await resolveTempPngAssetName(filePath)
    const { width, height } = extractAppleDeviceSize(size.size, size.padding)
    await sharp({
      create: {
        width: size.size.width,
        height: size.size.height,
        channels: 4,
        background: size.resizeOptions?.background ?? (size.dark ? 'black' : 'white'),
      },
    }).composite([{
      input: await sharp(image)
        .resize(
          width,
          height,
          size.resizeOptions,
        ).toBuffer(),
    }]).toFile(filePath)
    await optimizePng(filePath, size.png)
    if (buildOptions.logLevel !== 'silent') {
      consola.ready(green(`Generated PNG file: ${filePath.replace(/-temp\.png$/, '.png')}`))
      if (linkMediaOptions.log) {
        links.push(createAppleSplashScreenHtmlLink(
          size.size,
          size.landscape,
          linkMediaOptions.addMediaScreen,
          linkMediaOptions.xhtml,
          name,
          linkMediaOptions.basePath,
          size.dark,
        ))
      }
    }
  }))
}
