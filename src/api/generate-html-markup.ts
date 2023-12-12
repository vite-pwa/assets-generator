import type { ImageAssetsInstructions } from './types.ts'

export function generateHtmlMarkup(instruction: ImageAssetsInstructions) {
  const apple = Array.from(Object.values(instruction.apple))
  const favicon = Array.from(Object.values(instruction.favicon))
  const appleSplashScreen = Array.from(Object.values(instruction.appleSplashScreen))
  const links: string[] = []
  favicon.forEach(icon => icon.link?.length && links.push(icon.link))
  apple.forEach(icon => icon.link?.length && links.push(icon.link))
  appleSplashScreen.forEach(icon => icon.link?.length && links.push(icon.link))

  return links
}
