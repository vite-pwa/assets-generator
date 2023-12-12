import type { PngOptions, WebpOptions } from 'sharp'
import type sharp from 'sharp'
import type { BuiltInPreset, Preset } from '../config.ts'
import type { AppleSplashScreenLink, FaviconLink, HtmlLink, HtmlLinkPreset } from './html.ts'

export type ImageSourceInput =
    // eslint-disable-next-line n/prefer-global/buffer
    | Buffer
    | ArrayBuffer
    | Uint8Array
    | Uint8ClampedArray
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    | string

export interface GenerateOptions {
  /**
   * @default 0
   */
  padding?: number
  outputOptions?: any
  resizeOptions?: sharp.ResizeOptions
}
export type GenerateOptionsType = 'png' | 'webp' | 'none'
export type GenerateOptionsOptionType<T> =
    T extends 'png' ? GenerateOutputOptions<PngOptions> :
      T extends 'webp' ? GenerateOutputOptions<WebpOptions> :
        T extends 'none' ? GenerateOptions :
          never

export interface GenerateOutputOptions<T> extends GenerateOptions {
  outputOptions: T
}

export type GenerateFaviconType = 'png' | 'webp'
export type GenerateFaviconOptionsType<T> =
    T extends 'png' ? PngOptions :
      T extends 'webp' ? WebpOptions :
        never

/**
 * PWA web manifest icon.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/icons
 * @see https://w3c.github.io/manifest/#icons-member
 */
export interface ManifestIcon {
  src: string
  type?: string
  sizes?: string
  purpose?: string
}

/**
 * PWA web manifest icons.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/icons
 * @see https://w3c.github.io/manifest/#icons-member
 */
export interface ManifestIcons {
  icons: ManifestIcon[]
}

export type ManifestIconsType = 'string' | 'object'
export type ManifestIconsOptionsType<T> =
    T extends 'string' ? string :
      T extends 'object' ? ManifestIcons :
        never

export interface IconAsset<T extends HtmlLink> {
  /**
   * The name of the icon asset.
   */
  name: string
  /**
   * The icon asset url.
   */
  url: string
  /**
   * The icon asset width.
   *
   * For the SVG image favicon icon, it will be set to 0.
   */
  width: number
  /**
   * The icon asset height.
   *
   * For the SVG image favicon icon, it will be set to 0.
   */
  height: number
  /**
   * The icon asset mime type.
   */
  mimeType: 'image/png' | 'image/webp' | 'image/svg+xml' | 'image/x-icon'
  /**
   * The html head link.
   */
  link?: string
  /**
   * The html head link.
   */
  linkObject?: T
  /**
   * Creates the icon asset.
   */
  // eslint-disable-next-line n/prefer-global/buffer
  buffer: () => Promise<Buffer>
}

/**
 * PWA assets generation and injection options.
 */
export interface ImageAssets {
  /**
   * The image to use for generating the icon assets.
   */
  // eslint-disable-next-line n/prefer-global/buffer
  imageResolver: () => Buffer | Promise<Buffer>
  /**
   * The name of the image.
   */
  imageName: string
  /**
   * The original name of the image.
   */
  originalName?: string
  /**
   * The preset to use.
   */
  preset: BuiltInPreset | Preset
  /**
   * The preset for the favicons.
   *
   * If using the built-in preset option (`minimal` or `minimal-2023`), this option will be ignored (will be set to `default` or `2023` for `minimal` and `minimal-2023` respectively).
   *
   * @default 'default'
   */
  faviconPreset?: HtmlLinkPreset
  /**
   * Html link options.
   */
  htmlLinks: {
    xhtml: boolean
    includeId: boolean
  }
  /**
   * Base path to generate the html head links.
   */
  basePath: string
  /**
   * By default, the SVG favicon will use the SVG file name as the name.
   *
   * For example, if you provide `public/logo.svg` as the image source, the href in the link will be `<basePath>logo.svg`.
   *
   * @param name The name of the SVG icons.
   */
  resolveSvgName: (name: string) => string
}

export interface ImageAssetsInstructions {
  /**
   * The image path when providing an absolute path, otherwise the image name provided to `instructions`.
   */
  image: string
  /**
   * The original name of the image.
   */
  originalName?: string
  /**
   * The favicon icons instructions.
   *
   * The key is the favicon url of the icon asset.
   */
  favicon: Record<string, IconAsset<FaviconLink>>
  /**
   * The transparents icons instructions.
   *
   * The key is the icon url of the icon asset.
   */
  transparent: Record<string, IconAsset<HtmlLink>>
  /**
   * The maskable icons instructions.
   *
   * The key is the icon url of the icon asset.
   */
  maskable: Record<string, IconAsset<HtmlLink>>
  /**
   * The apple icons instructions.
   *
   * The key is the icon url of the icon asset.
   */
  apple: Record<string, IconAsset<HtmlLink>>
  /**
   * The apple splash screens icons instructions.
   *
   * The key is the favicon icons of the icon asset.
   */
  appleSplashScreen: Record<string, IconAsset<AppleSplashScreenLink>>
}
