import type { PngOptions, ResizeOptions } from 'sharp'
import type { AppleDeviceSize, AppleSplashScreenName, AppleSplashScreens, AppleTouchStartupImageOptions } from './types.ts'
import type { Preset } from './preset.ts'

export type AppleDeviceName =
    | 'iPad Pro 12.9"'
    | 'iPad Pro 11"'
    | 'iPad Pro 10.5"'
    | 'iPad Pro 9.7"'
    | 'iPad mini 7.9"'
    | 'iPad Air 10.5"'
    | 'iPad Air 9.7"'
    | 'iPad 10.2"'
    | 'iPad 9.7"'
    | 'iPhone 14 Pro Max'
    | 'iPhone 14 Pro'
    | 'iPhone 14 Plus'
    | 'iPhone 14'
    | 'iPhone 13 Pro Max'
    | 'iPhone 13 Pro'
    | 'iPhone 13'
    | 'iPhone 13 mini'
    | 'iPhone 12 Pro Max'
    | 'iPhone 12 Pro'
    | 'iPhone 12'
    | 'iPhone 12 mini'
    | 'iPhone 11 Pro Max'
    | 'iPhone 11 Pro'
    | 'iPhone 11'
    | 'iPhone XS Max'
    | 'iPhone XS'
    | 'iPhone XR'
    | 'iPhone X'
    | 'iPhone 8 Plus'
    | 'iPhone 8'
    | 'iPhone 7 Plus'
    | 'iPhone 7'
    | 'iPhone 6s Plus'
    | 'iPhone 6s'
    | 'iPhone 6 Plus'
    | 'iPhone 6'
    | 'iPhone SE 4.7"'
    | 'iPhone SE 4"'
    | 'iPod touch 5th generation and later'

export interface AppleSplashScreen extends Record<AppleDeviceName, AppleDeviceSize> {}

export const appleSplashScreenSizes: AppleSplashScreen = {
  'iPad Pro 12.9"': { width: 2048, height: 2732, scaleFactor: 2 },
  'iPad Pro 11"': { width: 1668, height: 2388, scaleFactor: 2 },
  'iPad Pro 10.5"': { width: 1668, height: 2388, scaleFactor: 2 },
  'iPad Pro 9.7"': { width: 1536, height: 2048, scaleFactor: 2 },
  'iPad mini 7.9"': { width: 1536, height: 2048, scaleFactor: 2 },
  'iPad Air 10.5"': { width: 1668, height: 2224, scaleFactor: 2 },
  'iPad Air 9.7"': { width: 1536, height: 2048, scaleFactor: 2 },
  'iPad 10.2"': { width: 1620, height: 2160, scaleFactor: 2 },
  'iPad 9.7"': { width: 1536, height: 2048, scaleFactor: 2 },
  'iPhone 14 Pro Max': { width: 1290, height: 2796, scaleFactor: 3 },
  'iPhone 14 Pro': { width: 1179, height: 2556, scaleFactor: 3 },
  'iPhone 14 Plus': { width: 1284, height: 2778, scaleFactor: 3 },
  'iPhone 14': { width: 1170, height: 2532, scaleFactor: 3 },
  'iPhone 13 Pro Max': { width: 1284, height: 2778, scaleFactor: 3 },
  'iPhone 13 Pro': { width: 1170, height: 2532, scaleFactor: 3 },
  'iPhone 13': { width: 1170, height: 2532, scaleFactor: 3 },
  'iPhone 13 mini': { width: 1125, height: 2436, scaleFactor: 3 },
  'iPhone 12 Pro Max': { width: 1284, height: 2778, scaleFactor: 3 },
  'iPhone 12 Pro': { width: 1170, height: 2532, scaleFactor: 3 },
  'iPhone 12': { width: 1170, height: 2532, scaleFactor: 3 },
  'iPhone 12 mini': { width: 1125, height: 2436, scaleFactor: 3 },
  'iPhone 11 Pro Max': { width: 1242, height: 2688, scaleFactor: 3 },
  'iPhone 11 Pro': { width: 1125, height: 2436, scaleFactor: 3 },
  'iPhone 11': { width: 828, height: 1792, scaleFactor: 2 },
  'iPhone XS Max': { width: 1242, height: 2688, scaleFactor: 3 },
  'iPhone XS': { width: 1125, height: 2436, scaleFactor: 3 },
  'iPhone XR': { width: 828, height: 1792, scaleFactor: 2 },
  'iPhone X': { width: 1125, height: 2436, scaleFactor: 3 },
  'iPhone 8 Plus': { width: 1242, height: 2208, scaleFactor: 3 },
  'iPhone 8': { width: 750, height: 1334, scaleFactor: 2 },
  'iPhone 7 Plus': { width: 1242, height: 2208, scaleFactor: 3 },
  'iPhone 7': { width: 750, height: 1334, scaleFactor: 2 },
  'iPhone 6s Plus': { width: 1242, height: 2208, scaleFactor: 3 },
  'iPhone 6s': { width: 750, height: 1334, scaleFactor: 2 },
  'iPhone 6 Plus': { width: 1242, height: 2208, scaleFactor: 3 },
  'iPhone 6': { width: 750, height: 1334, scaleFactor: 2 },
  'iPhone SE 4.7"': { width: 750, height: 1334, scaleFactor: 2 },
  'iPhone SE 4"': { width: 640, height: 1136, scaleFactor: 2 },
  'iPod touch 5th generation and later': { width: 640, height: 1136, scaleFactor: 2 },
}

export function defaultSplashScreenName(landscape: boolean, size: AppleDeviceSize, dark?: boolean) {
  return `apple-splash-${landscape ? 'landscape' : 'portrait'}-${typeof dark === 'boolean' ? (dark ? 'dark-' : 'light-') : ''}${size.width}x${size.height}.png`
}

export const AllAppleDeviceNames = Array.from(Object.keys(appleSplashScreenSizes).map(k => k as AppleDeviceName))

export function createAppleSplashScreens(
  options: {
    padding?: number
    resizeOptions?: ResizeOptions
    darkResizeOptions?: ResizeOptions
    linkMediaOptions?: AppleTouchStartupImageOptions
    png?: PngOptions
    name?: AppleSplashScreenName
  } = {},
  devices: AppleDeviceName[] = AllAppleDeviceNames,
) {
  const {
    padding,
    resizeOptions,
    darkResizeOptions,
    linkMediaOptions,
    png,
    name,
  } = options

  return {
    sizes: devices.map(deviceName => appleSplashScreenSizes[deviceName]),
    padding,
    resizeOptions,
    darkResizeOptions,
    linkMediaOptions,
    png,
    name,
  } satisfies AppleSplashScreens
}

export function combinePresetAndAppleSplashScreens(
  preset: Preset,
  options: {
    padding?: number
    resizeOptions?: ResizeOptions
    darkResizeOptions?: ResizeOptions
    linkMediaOptions?: AppleTouchStartupImageOptions
    png?: PngOptions
    name?: AppleSplashScreenName
  } = {},
  devices: AppleDeviceName[] = AllAppleDeviceNames,
) {
  return {
    ...preset,
    appleSplashScreens: createAppleSplashScreens(options, devices),
  } satisfies Preset
}
