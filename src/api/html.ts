import type { AppleDeviceSize, AppleSplashScreenName } from '../types.ts'
import { defaultSplashScreenName } from '../splash.ts'
import type { HtmlLink } from './types.ts'

type HtmlLinkType = 'string' | 'link'
type HtmlLinkReturnType<T> =
    T extends 'string' ? string :
      T extends 'link' ? HtmlLink :
        never

export function createAppleSplashScreenHtmlLink<Format extends HtmlLinkType>(
  format: Format,
  size: AppleDeviceSize,
  landscape: boolean,
  addMediaScreen: boolean,
  xhtml: boolean,
  name: AppleSplashScreenName = defaultSplashScreenName,
  basePath = '/',
  dark?: boolean,
): HtmlLinkReturnType<Format> {
  const link = createAppleSplashScreenLink(size, landscape, addMediaScreen, name, basePath, dark)

  return (format === 'string'
    ? `<link rel="${link.rel}" media="${link.media}" href="${link.href}"${xhtml ? ' /' : ''}>`
    : link) as HtmlLinkReturnType<Format>
}

function createAppleSplashScreenLink(
  size: AppleDeviceSize,
  landscape: boolean,
  addMediaScreen: boolean,
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
    href: `${basePath}${name(landscape, size, dark)}`,
  } satisfies HtmlLink
}

if (import.meta.vitest) {
  const { expect, expectTypeOf, it } = import.meta.vitest
  it('html api', () => {
    const linkString = createAppleSplashScreenHtmlLink(
      'string',
      { width: 320, height: 480, scaleFactor: 1 },
      true,
      true,
      true,
    )
    expectTypeOf(linkString).toEqualTypeOf<string>()
    // eslint-disable-next-line @typescript-eslint/quotes
    expect(linkString).toMatchInlineSnapshot(`"<link rel="apple-touch-startup-image" media="screen and (device-width: 480px) and (device-height: 320px) and (-webkit-device-pixel-ratio: 1) and (orientation: landscape)" href="/apple-splash-landscape-320x480.png" />"`)
    const link = createAppleSplashScreenHtmlLink(
      'link',
      { width: 320, height: 480, scaleFactor: 1 },
      true,
      true,
      true,
    )
    expectTypeOf(link).toEqualTypeOf<HtmlLink>()
    expect(link).toEqual({
      rel: 'apple-touch-startup-image',
      media: 'screen and (device-width: 480px) and (device-height: 320px) and (-webkit-device-pixel-ratio: 1) and (orientation: landscape)',
      href: '/apple-splash-landscape-320x480.png',
    } satisfies HtmlLink)
  })
}
