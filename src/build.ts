import { existsSync } from 'node:fs'
import { rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { consola } from 'consola'
import { green, yellow } from 'colorette'
import type { PngOptions, ResizeOptions } from 'sharp'
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
  sameAssetSize,
  toResolvedAsset,
  toResolvedSize,
} from './utils.ts'
import {
  createAppleSplashScreenHtmlLink,
  defaultPngCompressionOptions,
  defaultPngOptions,
  generateFavicon,
  generateMaskableAsset,
  generateTransparentAsset,
} from './api'

export * from './types'
export {
  defaultAssetName,
  defaultPngCompressionOptions,
  defaultPngOptions,
  toResolvedAsset,
}

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

async function generateFaviconFile(
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

    // const pngBuffer = await sharp(png).toFormat('png').toBuffer()
    // await writeFile(favicon, encode([pngBuffer]))
    await writeFile(favicon, await generateFavicon('png', png))
    if (buildOptions.logLevel !== 'silent')
      consola.ready(green(`Generated ICO file: ${favicon}`))
  }))
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
    const filePath = resolve(folder, assets.assetName('transparent', size))
    if (!buildOptions.overrideAssets && existsSync(filePath)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping, PNG file already exists: ${filePath}`))

      return
    }

    const result = await generateTransparentAsset('png', image, size, {
      padding,
      resizeOptions,
      outputOptions: assets.png,
    })

    await result.toFile(filePath)
    if (buildOptions.logLevel !== 'silent')
      consola.ready(green(`Generated PNG file: ${filePath.replace(/-temp\.png$/, '.png')}`))

    await generateFaviconFile(buildOptions, folder, 'transparent', assets, size)
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
    const filePath = resolve(folder, assets.assetName(type, size))
    if (!buildOptions.overrideAssets && existsSync(filePath)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping, PNG file already exists: ${filePath}`))

      return
    }

    const result = await generateMaskableAsset('png', image, size, {
      padding,
      resizeOptions,
      outputOptions: assets.png,
    })

    await result.toFile(filePath)
    if (buildOptions.logLevel !== 'silent')
      consola.ready(green(`Generated PNG file: ${filePath.replace(/-temp\.png$/, '.png')}`))

    await generateFaviconFile(buildOptions, folder, type, assets, size)
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
    const filePath = resolve(folder, name(size.landscape, size.size, size.dark))
    if (!buildOptions.overrideAssets && existsSync(filePath)) {
      if (buildOptions.logLevel !== 'silent')
        consola.log(yellow(`Skipping, PNG file already exists: ${filePath}`))

      return
    }

    await (await generateMaskableAsset('png', image, size.size, {
      padding: size.padding,
      resizeOptions: {
        ...size.resizeOptions,
        background: size.resizeOptions?.background ?? (size.dark ? 'black' : 'white'),
      },
      outputOptions: size.png,
    })).toFile(filePath)
    if (buildOptions.logLevel !== 'silent') {
      consola.ready(green(`Generated PNG file: ${filePath.replace(/-temp\.png$/, '.png')}`))
      if (linkMediaOptions.log) {
        links.push(createAppleSplashScreenHtmlLink('string', {
          size: size.size,
          landscape: size.landscape,
          addMediaScreen: linkMediaOptions.addMediaScreen,
          xhtml: linkMediaOptions.xhtml,
          name,
          basePath: linkMediaOptions.basePath,
          dark: size.dark,
        }))
      }
    }
  }))
}
