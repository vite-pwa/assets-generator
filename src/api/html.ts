import { defaultSplashScreenName } from '../splash.ts'
import type { HtmlLink, HtmlLinkOptions, HtmlLinkReturnType, HtmlLinkType } from './types.ts'

export function createAppleSplashScreenHtmlLink<Format extends HtmlLinkType>(
  format: Format,
  options: HtmlLinkOptions,
): HtmlLinkReturnType<Format> {
  const link = createAppleSplashScreenLink(
    createRequiredHtmlLinkOptions(options),
  )

  return (
    format === 'string'
      ? `<link rel="${link.rel}" media="${link.media}" href="${link.href}"${options.xhtml ? ' /' : ''}>`
      : link
  ) as HtmlLinkReturnType<Format>
}

interface RequiredHtmlLinkOptions extends Required<Omit<HtmlLinkOptions, 'xhtml'>> {}

function createAppleSplashScreenLink(options: RequiredHtmlLinkOptions) {
  const {
    size,
    landscape,
    addMediaScreen,
    name,
    basePath,
    dark,
  } = options
  const { width, height, scaleFactor } = size
  // As weird as it gets, Apple expects the same device width and height values from portrait orientation, for landscape
  const tokens: string[] = [
    `(device-width: ${(landscape ? height : width) / scaleFactor}px)`,
    `(device-height: ${(landscape ? width : height) / scaleFactor}px)`,
    `(-webkit-device-pixel-ratio: ${scaleFactor})`,
    `(orientation: ${landscape ? 'landscape' : 'portrait'})`,
  ]

  if (dark)
    tokens.unshift('(prefers-color-scheme: dark)')

  if (addMediaScreen)
    tokens.unshift('screen')

  return {
    rel: 'apple-touch-startup-image',
    media: tokens.join(' and '),
    href: `${basePath}${name(landscape, size, dark)}`,
  } satisfies HtmlLink
}

function createRequiredHtmlLinkOptions(options: HtmlLinkOptions) {
  return <RequiredHtmlLinkOptions>{
    size: options.size,
    landscape: options.landscape,
    addMediaScreen: options.addMediaScreen,
    name: options.name ?? defaultSplashScreenName,
    basePath: options.basePath ?? '/',
    dark: options.dark === true,
  }
}

if (import.meta.vitest) {
  const { expect, expectTypeOf, it } = import.meta.vitest
  it('html api', () => {
    const options: HtmlLinkOptions = {
      size: { width: 320, height: 480, scaleFactor: 1 },
      landscape: true,
      addMediaScreen: true,
      xhtml: true,
    }
    const linkString = createAppleSplashScreenHtmlLink('string', options)
    expectTypeOf(linkString).toEqualTypeOf<string>()
    // eslint-disable-next-line @typescript-eslint/quotes
    expect(linkString).toMatchInlineSnapshot(`"<link rel="apple-touch-startup-image" media="screen and (device-width: 480px) and (device-height: 320px) and (-webkit-device-pixel-ratio: 1) and (orientation: landscape)" href="/apple-splash-landscape-light-320x480.png" />"`)
    const link = createAppleSplashScreenHtmlLink('link', options)
    expectTypeOf(link).toEqualTypeOf<HtmlLink>()
    expect(link).toMatchInlineSnapshot(`
      {
        "href": "/apple-splash-landscape-light-320x480.png",
        "media": "screen and (device-width: 480px) and (device-height: 320px) and (-webkit-device-pixel-ratio: 1) and (orientation: landscape)",
        "rel": "apple-touch-startup-image",
      }
    `)
  })
}
