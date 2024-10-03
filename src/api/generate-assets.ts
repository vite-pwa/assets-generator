import type { IconAsset, ImageAssetsInstructions } from './types.ts'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function generateAssets(
  instruction: ImageAssetsInstructions,
  overrideAssets: boolean,
  folder: string,
  log?: (message: string, ignored: boolean) => void,
) {
  const transparent = Array.from(Object.values(instruction.transparent))
  await Promise.all(transparent.map(icon => generateAsset('PNG', icon, folder, overrideAssets, log)))
  const maskable = Array.from(Object.values(instruction.maskable))
  await Promise.all(maskable.map(icon => generateAsset('PNG', icon, folder, overrideAssets, log)))
  const apple = Array.from(Object.values(instruction.apple))
  await Promise.all(apple.map(icon => generateAsset('PNG', icon, folder, overrideAssets, log)))
  const favicon = Array.from(Object.values(instruction.favicon))
  await Promise.all(favicon.filter(icon => !icon.name.endsWith('.svg')).map(icon => generateAsset('ICO', icon, folder, overrideAssets, log)))
  const appleSplashScreen = Array.from(Object.values(instruction.appleSplashScreen))
  await Promise.all(appleSplashScreen.map(icon => generateAsset('PNG', icon, folder, overrideAssets, log)))
}

async function generateAsset(
  type: 'ICO' | 'PNG',
  icon: IconAsset<any>,
  folder: string,
  overrideAssets: boolean,
  log?: (message: string, ignored: boolean) => void,
) {
  const filePath = resolve(folder, icon.name)
  if (!overrideAssets && existsSync(filePath)) {
    log?.(`Skipping, ${type} file already exists: ${filePath}`, true)
    return
  }

  await icon
    .buffer()
    .then(b => writeFile(resolve(folder, icon.name), new Uint8Array(b)))
    .then(() => {})

  log?.(`Generated ${type} file: ${filePath}`, false)
}
