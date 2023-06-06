import { existsSync } from 'node:fs'
import { rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { consola } from 'consola'
import { green, yellow } from 'colorette'
import type { PngOptions } from 'sharp'
import sharp from 'sharp'
import { encode } from 'sharp-ico'
import type { AssetType, ResolvedAssetSize, ResolvedAssets, ResolvedBuildOptions } from './types.ts'
import {
  defaultAssetName,
  defaultPngCompressionOptions,
  defaultPngOptions,
  sameAssetSize,
  toResolvedAsset,
} from './utils.ts'

export * from './types'
export { defaultAssetName, defaultPngCompressionOptions, defaultPngOptions, toResolvedAsset }

export async function generatePWAImageAssets(
  buildOptions: ResolvedBuildOptions,
  image: string,
  assets: ResolvedAssets,
) {
  const imagePath = resolve(buildOptions.root, image)
  const folder = dirname(imagePath)

  await Promise.all([
    generateTransparentAssets(buildOptions, assets, imagePath, folder),
    generateMaskableAssets('maskable', buildOptions, assets, imagePath, folder),
    generateMaskableAssets('apple', buildOptions, assets, imagePath, folder),
  ])
}

export async function generatePWAAssets(
  images: string[],
  assets: ResolvedAssets,
  buildOptions: ResolvedBuildOptions,

) {
  await Promise.all(images.map(image => generatePWAImageAssets(buildOptions, image, assets)))
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

  await Promise.all(favicons.map(async ([size, name]) => {
    // don't generate favicons multiple times
    if (!sameAssetSize(size, assetSize))
      return

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

async function optimizePng(filePath: string, png: PngOptions) {
  try {
    await sharp(filePath).png(png).toFile(`${filePath.replace(/-temp\.png$/, '.png')}`)
  }
  finally {
    await rm(filePath, { force: true })
  }
}

function resolveTempPngAssetName(name: string) {
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

    filePath = resolveTempPngAssetName(filePath)
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

    filePath = resolveTempPngAssetName(filePath)
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
