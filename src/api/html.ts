import type { AppleDeviceSize, AppleSplashScreenName } from '../types.ts'
import { defaultSplashScreenName } from '../splash.ts'
import type { HtmlLink } from './types.ts'

export function createAppleSplashScreenLink(
  size: AppleDeviceSize,
  landscape: boolean,
  addMediaScreen: boolean,
  xhtml: boolean,
  name: AppleSplashScreenName = defaultSplashScreenName,
  basePath = '/',
  dark?: boolean,
) {
  const { width, height, scaleFactor } = size
  // As weird as it gets, Apple expects the same device width and height values from portrait orientation, for landscape
  const tokens: string[] = [
        `(device-width: ${(landscape ? height : width) / scaleFactor}px)`,
        `(device-height: ${(landscape ? width : height) / scaleFactor}px)`,
        `(-webkit-device-pixel-ratio: ${scaleFactor})`,
        `(orientation: ${landscape ? 'landscape' : 'portrait'})`,
  ]

  if (dark === true)
    tokens.unshift('(prefers-color-scheme: dark)')

  if (addMediaScreen)
    tokens.unshift('screen')

  return {
    rel: 'apple-touch-startup-image',
    media: tokens.join(' and '),
    href: `${basePath}${name(landscape, size, dark)}"${xhtml ? ' /' : ''}`,
  } satisfies HtmlLink
}

export function createAppleSplashScreenHtmlLinkString(
  size: AppleDeviceSize,
  landscape: boolean,
  addMediaScreen: boolean,
  xhtml: boolean,
  name: AppleSplashScreenName = defaultSplashScreenName,
  basePath = '/',
  dark?: boolean,
) {
  const { rel, media, href } = createAppleSplashScreenLink(size, landscape, addMediaScreen, xhtml, name, basePath, dark)

  return `<link rel="${rel}" media="${media}" href="${href}>`
}
