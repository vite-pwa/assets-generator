import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { consola } from 'consola'
import { green, yellow } from 'colorette'
import type { LogLevel } from '../types.ts'
import type { IconAsset, ImageAssetsInstructions } from './types.ts'

export async function generateAssets(
  instruction: ImageAssetsInstructions,
  overrideAssets: boolean,
  logLevel: LogLevel,
  folder: string,
) {
  const transparent = Array.from(Object.values(instruction.transparent))
  await Promise.all(transparent.map(icon => generateAsset('PNG', icon, folder, overrideAssets, logLevel)))
  const maskable = Array.from(Object.values(instruction.maskable))
  await Promise.all(maskable.map(icon => generateAsset('PNG', icon, folder, overrideAssets, logLevel)))
  const apple = Array.from(Object.values(instruction.apple))
  await Promise.all(apple.map(icon => generateAsset('PNG', icon, folder, overrideAssets, logLevel)))
  const favicon = Array.from(Object.values(instruction.favicon))
  await Promise.all(favicon.filter(icon => !icon.name.endsWith('.svg')).map(icon => generateAsset('ICO', icon, folder, overrideAssets, logLevel)))
  const appleSplashScreen = Array.from(Object.values(instruction.appleSplashScreen))
  await Promise.all(appleSplashScreen.map(icon => generateAsset('PNG', icon, folder, overrideAssets, logLevel)))
}

async function generateAsset(
  type: 'ICO' | 'PNG',
  icon: IconAsset<any>,
  folder: string,
  overrideAssets: boolean,
  logLevel: LogLevel,
) {
  const filePath = resolve(folder, icon.name)
  if (!overrideAssets && existsSync(filePath)) {
    if (logLevel !== 'silent')
      consola.log(yellow(`Skipping, ${type} file already exists: ${filePath}`))

    return
  }

  await icon
    .buffer()
    .then(b => writeFile(resolve(folder, icon.name), b))
    .then(() => {})
  if (logLevel !== 'silent')
    consola.ready(green(`Generated ${type} file: ${filePath}`))
}
