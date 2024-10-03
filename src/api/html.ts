import type { AppleDeviceSize, AppleSplashScreenName, AssetSize } from '../types.ts'
import { defaultSplashScreenName } from '../splash.ts'
import { toResolvedSize } from '../utils.ts'

export type HtmlLinkPreset = 'default' | '2023'

export interface HtmlLink {
  id: string
  rel: 'apple-touch-startup-image' | 'apple-touch-icon' | 'icon'
  href: string
}

export interface AppleSplashScreenLink extends HtmlLink {
  media: string
}

export interface FaviconLink extends HtmlLink {
  sizes?: string
  type?: string
}

export type HtmlLinkType = 'string' | 'link'
export type HtmlLinkReturnType<T, R extends HtmlLink> =
    T extends 'string' ? string :
      T extends 'link' ? R :
        never

export interface HtmlIconLinkOptions {
  name: string
  /**
   * Required only for non SVG favicon
   */
  size?: AssetSize
  xhtml?: boolean
  basePath?: string
  /**
   * Render the id attribute when using string format?
   *
   * The id will always be present in object notation.
   *
   * @default false
   */
  includeId?: boolean
}

export interface AppleSplahScreenHtmlLinkOptions {
  size: AppleDeviceSize
  landscape: boolean
  addMediaScreen: boolean
  xhtml?: boolean
  name?: AppleSplashScreenName
  basePath?: string
  dark?: boolean
  /**
   * Render the id attribute when using string format?
   *
   * The id will always be present in object notation.
   *
   * @default false
   */
  includeId?: boolean
}

export function createFaviconHtmlLink<Format extends HtmlLinkType>(
  format: Format,
  preset: HtmlLinkPreset,
  icon: HtmlIconLinkOptions,
): HtmlLinkReturnType<Format, FaviconLink> {
  const result = createFaviconLink(preset, icon)
  if (format === 'string') {
    let favicon = `<link${icon.includeId ? ` id="${result.id}"` : ''} rel="${result.rel}" href="${result.href}"`
    if (result.sizes)
      favicon += ` sizes="${result.sizes}"`

    if (result.type)
      favicon += ` type="${result.type}"`

    favicon += `${icon.xhtml ? ' /' : ''}>`

    return favicon as HtmlLinkReturnType<Format, FaviconLink>
  }

  return result as HtmlLinkReturnType<Format, FaviconLink>
}

export function createAppleTouchIconHtmlLink<Format extends HtmlLinkType>(
  format: Format,
  icon: HtmlIconLinkOptions,
): HtmlLinkReturnType<Format, HtmlLink> {
  const href = `${icon.basePath ?? '/'}${icon.name}`
  const { width, height } = toResolvedSize(icon.size!)
  const id = `ati-${width}-${height}`
  if (format === 'string')
    return `<link${icon.includeId ? ` id="${id}"` : ''} rel="apple-touch-icon" href="${href}"${icon.xhtml ? ' /' : ''}>` as HtmlLinkReturnType<Format, HtmlLink>

  return {
    id,
    rel: 'apple-touch-icon',
    href,
  } as HtmlLinkReturnType<Format, HtmlLink>
}

export function createAppleSplashScreenHtmlLink<Format extends HtmlLinkType>(
  format: Format,
  options: AppleSplahScreenHtmlLinkOptions,
): HtmlLinkReturnType<Format, AppleSplashScreenLink> {
  const link = createAppleSplashScreenLink(
    createRequiredHtmlLinkOptions(options),
  )

  return (
    format === 'string'
      ? `<link${options.includeId ? ` id="${link.id}"` : ''} rel="${link.rel}" media="${link.media!}" href="${link.href}"${options.xhtml ? ' /' : ''}>`
      : link
  ) as HtmlLinkReturnType<Format, AppleSplashScreenLink>
}

function createFaviconLink(
  preset: HtmlLinkPreset,
  icon: HtmlIconLinkOptions,
) {
  const href = `${icon.basePath ?? '/'}${icon.name}`
  if (icon.name.endsWith('.svg')) {
    if (preset === '2023') {
      return {
        id: 'fav-svg',
        type: 'image/svg+xml',
        href,
        rel: 'icon',
        sizes: 'any',
      } satisfies FaviconLink
    }

    return {
      id: 'fav-svg',
      type: 'image/svg+xml',
      href,
      rel: 'icon',
    } satisfies FaviconLink
  }

  const { width, height } = toResolvedSize(icon.size!)

  if (preset === '2023') {
    return {
      id: `fav-${width}x${height}`,
      href,
      rel: 'icon',
      sizes: `${width}x${height}`,
    } satisfies FaviconLink
  }

  return {
    id: `fav-${height}x${height}`,
    href,
    rel: 'icon',
    sizes: 'any',
  } satisfies FaviconLink
}

interface RequiredAppleSplahScreenHtmlLinkOptions extends Required<Omit<AppleSplahScreenHtmlLinkOptions, 'xhtml'>> {}

function createAppleSplashScreenLink(options: RequiredAppleSplahScreenHtmlLinkOptions) {
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
    id: `atsi-${landscape ? height : width}-${landscape ? width : height}-${scaleFactor}-${dark ? 'dark' : 'light'}`,
    rel: 'apple-touch-startup-image',
    media: tokens.join(' and '),
    href: `${basePath}${name(landscape, size, dark)}`,
  } satisfies AppleSplashScreenLink
}

function createRequiredHtmlLinkOptions(options: AppleSplahScreenHtmlLinkOptions) {
  return {
    size: options.size,
    landscape: options.landscape,
    addMediaScreen: options.addMediaScreen,
    name: options.name ?? defaultSplashScreenName,
    basePath: options.basePath ?? '/',
    dark: options.dark === true,
    includeId: options.includeId === true,
  } satisfies AppleSplahScreenHtmlLinkOptions
}

if (import.meta.vitest) {
  const { describe, expect, expectTypeOf, it } = import.meta.vitest
  describe('html api', () => {
    it('apple splash screen generation', () => {
      const options = {
        size: { width: 320, height: 480, scaleFactor: 1 },
        landscape: true,
        addMediaScreen: true,
        xhtml: true,
      } satisfies AppleSplahScreenHtmlLinkOptions
      const linkString = createAppleSplashScreenHtmlLink('string', options)
      expectTypeOf(linkString).toEqualTypeOf<string>()
      expect(linkString).toMatchInlineSnapshot(`"<link rel="apple-touch-startup-image" media="screen and (device-width: 480px) and (device-height: 320px) and (-webkit-device-pixel-ratio: 1) and (orientation: landscape)" href="/apple-splash-landscape-light-320x480.png" />"`)
      const link = createAppleSplashScreenHtmlLink('link', options)
      expectTypeOf(link).toEqualTypeOf<AppleSplashScreenLink>()
      expect(link).toMatchInlineSnapshot(`
        {
          "href": "/apple-splash-landscape-light-320x480.png",
          "id": "atsi-480-320-1-light",
          "media": "screen and (device-width: 480px) and (device-height: 320px) and (-webkit-device-pixel-ratio: 1) and (orientation: landscape)",
          "rel": "apple-touch-startup-image",
        }
      `)
    })
    it('apple touch icon generation', () => {
      const appleTouchIconOptions = {
        name: 'apple-touch-icon.png',
        size: 180,
      } satisfies HtmlIconLinkOptions
      const appleTouchIconString = createAppleTouchIconHtmlLink('string', appleTouchIconOptions)
      expectTypeOf(appleTouchIconString).toEqualTypeOf<string>()
      expect(appleTouchIconString).toMatchInlineSnapshot(`"<link rel="apple-touch-icon" href="/apple-touch-icon.png">"`)
      const appleTouchIcon = createAppleTouchIconHtmlLink('link', appleTouchIconOptions)
      expectTypeOf(appleTouchIcon).toEqualTypeOf<HtmlLink>()
      expect(appleTouchIcon).toMatchInlineSnapshot(`
        {
          "href": "/apple-touch-icon.png",
          "id": "ati-180-180",
          "rel": "apple-touch-icon",
        }
      `)
    })
    it('favicon generation', () => {
      const svgFaviconOptions = {
        name: 'favicon.svg',
      } satisfies HtmlIconLinkOptions
      const svgFavicon2023String = createFaviconHtmlLink('string', '2023', svgFaviconOptions)
      expectTypeOf(svgFavicon2023String).toEqualTypeOf<string>()
      expect(svgFavicon2023String).toMatchInlineSnapshot(`"<link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml">"`)
      const svgFavicon2023 = createFaviconHtmlLink('link', '2023', svgFaviconOptions)
      expectTypeOf(svgFavicon2023).toEqualTypeOf<FaviconLink>()
      expect(svgFavicon2023).toMatchInlineSnapshot(`
        {
          "href": "/favicon.svg",
          "id": "fav-svg",
          "rel": "icon",
          "sizes": "any",
          "type": "image/svg+xml",
        }
      `)
      const svgFaviconDefaultString = createFaviconHtmlLink('string', 'default', svgFaviconOptions)
      expectTypeOf(svgFaviconDefaultString).toEqualTypeOf<string>()
      expect(svgFaviconDefaultString).toMatchInlineSnapshot(`"<link rel="icon" href="/favicon.svg" type="image/svg+xml">"`)
      const svgFaviconDefault = createFaviconHtmlLink('link', 'default', svgFaviconOptions)
      expectTypeOf(svgFaviconDefault).toEqualTypeOf<FaviconLink>()
      expect(svgFaviconDefault).toMatchInlineSnapshot(`
        {
          "href": "/favicon.svg",
          "id": "fav-svg",
          "rel": "icon",
          "type": "image/svg+xml",
        }
      `)
      const icoFaviconOptions = {
        name: 'favicon.ico',
        size: 32,
      } satisfies HtmlIconLinkOptions
      const icoFavicon2023String = createFaviconHtmlLink('string', '2023', icoFaviconOptions)
      expectTypeOf(icoFavicon2023String).toEqualTypeOf<string>()
      expect(icoFavicon2023String).toMatchInlineSnapshot(`"<link rel="icon" href="/favicon.ico" sizes="32x32">"`)
      const icoFavicon2023 = createFaviconHtmlLink('link', '2023', icoFaviconOptions)
      expectTypeOf(icoFavicon2023).toEqualTypeOf<FaviconLink>()
      expect(icoFavicon2023).toMatchInlineSnapshot(`
        {
          "href": "/favicon.ico",
          "id": "fav-32x32",
          "rel": "icon",
          "sizes": "32x32",
        }
      `)
      const icoFaviconDefaultString = createFaviconHtmlLink('string', 'default', icoFaviconOptions)
      expectTypeOf(icoFaviconDefaultString).toEqualTypeOf<string>()
      expect(icoFaviconDefaultString).toMatchInlineSnapshot(`"<link rel="icon" href="/favicon.ico" sizes="any">"`)
      const icoFaviconDefault = createFaviconHtmlLink('link', 'default', icoFaviconOptions)
      expectTypeOf(icoFaviconDefault).toEqualTypeOf<FaviconLink>()
      expect(icoFaviconDefault).toMatchInlineSnapshot(`
        {
          "href": "/favicon.ico",
          "id": "fav-32x32",
          "rel": "icon",
          "sizes": "any",
        }
      `)
    })
  })
}
