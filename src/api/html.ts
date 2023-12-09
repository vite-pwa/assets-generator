import { defaultSplashScreenName } from '../splash.ts'
import type { AppleDeviceSize, AppleSplashScreenName, AssetSize } from '../types.ts'

export type FaviconLinkType = | 'icon' | 'apple-touch-icon'

export interface HtmlLink {
  id: string
  rel: 'apple-touch-startup-image' | FaviconLinkType
  href: string
}

export interface AppleSplashScreenLink extends HtmlLink {
  media: string
}

export interface FaviconLink extends HtmlLink {
  sizes: string
}

export interface SvgFaviconLink extends FaviconLink {
  type: string
}

export type IconLink = HtmlLink | FaviconLink | SvgFaviconLink

export type HtmlLinkType = 'string' | 'link'
export type HtmlLinkReturnType<T, R extends HtmlLink> =
    T extends 'string' ? string :
      T extends 'link' ? R :
        never

export interface HtmlIconLinkOptions {
  name: string
  type: FaviconLinkType
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

export function createIconHtmlLink<Format extends HtmlLinkType>(
  format: Format,
  preset: 'default' | '2023',
  icon: HtmlIconLinkOptions,
): HtmlLinkReturnType<Format, IconLink> {
  const result = createIconLink(preset, icon)

  if (format === 'string') {
    if (icon.type === 'apple-touch-icon')
      return `<link${icon.includeId ? ` id="${result.id}"` : ''} rel="${result.rel}" href="${result.href}"${icon.xhtml ? ' /' : ''}>` as HtmlLinkReturnType<Format, IconLink>

    let favicon = `<link${icon.includeId ? ` id="${result.id}"` : ''}rel="${result.rel}" href="${result.href}" `
    if (result.sizes)
      favicon += `sizes="${result.sizes}" `

    if (result.type)
      favicon += `type="${result.type}" `

    favicon += `${icon.xhtml ? '/' : ''}>`

    return favicon as HtmlLinkReturnType<Format, IconLink>
  }

  return result as HtmlLinkReturnType<Format, IconLink>
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

function createIconLink(
  preset: 'default' | '2023',
  icon: HtmlIconLinkOptions,
) {
  const href = `${icon.basePath ?? '/'}${icon.name}`
  if (icon.type === 'apple-touch-icon') {
    return {
      id: 'apple-touch-icon',
      href,
      rel: 'apple-touch-icon',
    } satisfies IconLink
  }

  if (icon.name.endsWith('.svg')) {
    if (preset === '2023') {
      return {
        id: 'fav-svg',
        type: 'image/svg+xml',
        href,
        rel: 'icon',
        sizes: 'any',
      } satisfies IconLink
    }

    return {
      id: 'fav-svg',
      type: 'image/svg+xml',
      href,
      rel: 'icon',
    } satisfies IconLink
  }

  if (preset === '2023') {
    return {
      id: `fav-${icon.size}x${icon.size}`,
      href,
      rel: 'icon',
      sizes: `${icon.size}x${icon.size}`,
    } satisfies IconLink
  }

  return {
    id: `fav-${icon.size}x${icon.size}`,
    href,
    rel: 'icon',
    sizes: 'any',
  } satisfies IconLink
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
  const { expect, expectTypeOf, it } = import.meta.vitest
  it('html api', () => {
    const options = {
      size: { width: 320, height: 480, scaleFactor: 1 },
      landscape: true,
      addMediaScreen: true,
      xhtml: true,
    } satisfies AppleSplahScreenHtmlLinkOptions
    const linkString = createAppleSplashScreenHtmlLink('string', options)
    expectTypeOf(linkString).toEqualTypeOf<string>()
    // eslint-disable-next-line @typescript-eslint/quotes
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
    const appleTouchIconOptions = {
      name: 'apple-touch-icon.png',
      type: 'apple-touch-icon',
    } satisfies HtmlIconLinkOptions
    const appleTouchIconString = createIconHtmlLink('string', 'default', appleTouchIconOptions)
    expectTypeOf(appleTouchIconString).toEqualTypeOf<string>()
    // eslint-disable-next-line @typescript-eslint/quotes
    expect(appleTouchIconString).toMatchInlineSnapshot(`"<link rel="apple-touch-icon" href="/apple-touch-icon.png">"`)
    const appleTouchIcon = createIconHtmlLink('link', 'default', appleTouchIconOptions)
    expectTypeOf(appleTouchIcon).toEqualTypeOf<IconLink>()
    expect(appleTouchIcon).toMatchInlineSnapshot(`
      {
        "href": "/apple-touch-icon.png",
        "id": "apple-touch-icon",
        "rel": "apple-touch-icon",
      }
    `)
  })
}
