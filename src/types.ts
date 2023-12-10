import type { PngOptions, ResizeOptions } from 'sharp'
import type { HeadLinkOptions } from './config.ts'

/**
 * Icon size.
 */
export type AssetSize = number | { width: number; height: number }

/**
 * Icon size with resolved width and height.
 */
export interface ResolvedAssetSize {
  original: AssetSize
  width: number
  height: number
}

/**
 * Favicon size and name.
 */
export type Favicon = [size: AssetSize, name: string]

export interface Asset {
  sizes: AssetSize[]
  padding?: number
  resizeOptions?: ResizeOptions
  favicons?: Favicon[]
}

export interface AppleDeviceSize {
  width: number
  height: number
  scaleFactor: number
  /**
   * The padding to add to the splash screen.
   *
   * @default 0.3
   */
  padding?: number
  /**
   * @default { compressionLevel: 9, quality: 60 }
   */
  png?: PngOptions
  /**
   * Resize options: by default, `sharp` will use white background color.
   */
  resizeOptions?: ResizeOptions
  /**
   * Dark resize options.
   *
   * If you want to also add a dark splash screen, change the background color with this another option.
   */
  darkResizeOptions?: ResizeOptions
}

export type AppleSplashScreenName = (landscape: boolean, size: AppleDeviceSize, dark?: boolean) => string

export interface AppleTouchStartupImageOptions {
  /**
   * Show the html head links?
   *
   * @default true
   */
  log?: boolean
  /**
   * Base path to generate the html head links.
   *
   * @default '/'
   */
  basePath?: string
  /**
   * Add media screen to the `apple-touch-startup-image` rel link?
   *
   * @default true
   */
  addMediaScreen?: boolean
  /**
   * Using XHTML?
   *
   * @default false
   */
  xhtml?: boolean
}

export interface AppleSplashScreens {
  sizes: AppleDeviceSize[]
  /**
   * The padding to add to the splash screen.
   *
   * @default 0.3
   */
  padding?: number
  /**
   * Global png options.
   *
   * @default { compressionLevel: 9, quality: 60 }
   */
  png?: PngOptions
  /**
   * Resize options: by default, `sharp` will use white background color.
   */
  resizeOptions?: ResizeOptions
  /**
   * Dark resize options.
   *
   * If you want to also add a dark splash screen, change the background color with this another option.
   */
  darkResizeOptions?: ResizeOptions
  /**
   * Options to generate the html head links.
   */
  linkMediaOptions?: AppleTouchStartupImageOptions
  /**
   * Customize the splash screen name.
   *
   * @param landscape Is the splash screen landscape?
   * @param size The splash screen size.
   * @param dark Is the splash screen dark?
   * @returns The splash screen name.
   *
   * @default (landscape, size, dark?: boolean) => `apple-splash-${landscape ? 'landscape' : 'portrait'}-${typeof dark === 'boolean' ? (dark ? 'dark-' : 'light-') : ''}${size.width}x${size.height}.png`
   */
  name?: AppleSplashScreenName
}

export interface ResolvedAppleSplashScreens {
  padding: number
  sizes: AppleDeviceSize[]
  linkMediaOptions: Required<AppleTouchStartupImageOptions>
  name: AppleSplashScreenName
  png: PngOptions
}

export type AssetType = 'transparent' | 'maskable' | 'apple'

export interface ResolvedAsset extends Required<Omit<Asset, 'favicons' | 'sizes'>> {
  sizes: ResolvedAssetSize[]
  favicons?: Favicon[]
}

export interface Assets extends Record<AssetType, Asset> {
  /**
   * @default { compressionLevel: 9, quality: 60 }
   */
  png?: PngOptions
  /**
   * @default `pwa-<width>x<height>.png`, `maskable-icon-<width>x<height>.png`, `apple-touch-icon-<width>x<height>.png`
   */
  assetName?: (type: AssetType, size: ResolvedAssetSize) => string
  /**
   * Splash screens.
   */
  appleSplashScreens?: AppleSplashScreens
}

export interface ResolvedAssets {
  assets: Record<AssetType, ResolvedAsset>
  png: PngOptions
  /**
   * @default `pwa-<width>x<height>.png`, `maskable-icon-<width>x<height>.png`, `apple-touch-icon-<width>x<height>.png`
   */
  assetName: (type: AssetType, size: ResolvedAssetSize) => string
}

export type LogLevel = 'info' | 'warn' | 'silent'

export interface BuildOptions {
  root: string
  logLevel?: LogLevel
  overrideAssets?: boolean
  headLinkOptions: Required<HeadLinkOptions>
}

export interface ResolvedBuildOptions extends Required<BuildOptions> {}
