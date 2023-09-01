import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { LoadConfigResult, LoadConfigSource } from 'unconfig'
import { createConfigLoader as createLoader } from 'unconfig'
import type { Preset } from './preset.ts'
import type { LogLevel } from './types.ts'

export type { LoadConfigResult, LoadConfigSource }

export * from './types.ts'
export * from './presets'
export * from './splash.ts'
export {
  defaultAssetName,
  defaultPngCompressionOptions,
  defaultPngOptions,
} from './utils.ts'

export type { Preset }

/**
 * Built-in presets.
 * - `minimal`: Only generate the bare minimum assets.
 * - `android`: Generate assets for Android.
 * - `windows`: Generate assets for Windows.
 * - `ios`: Generate assets for iOS.
 * - `all`: `android`, `windows` and `ios` presets combined.
 */
export type BuiltInPreset = 'minimal' | 'android' | 'windows' | 'ios' | 'all'

export interface UserConfig {
  /**
     * Project root directory. Can be an absolute path, or a path relative from
     * the location of the config file itself.
     * @default process.cwd()
     */
  root?: string
  /**
   * Path to the config file.
   *
   * Default resolving to `pwa-assets.config.[js|mjs|cjs]`
   *
   * Setting to `false` will disable config resolving.
   */
  config?: string | false
  /**
   * Override assets?
   *
   * @default true
   */
  overrideAssets?: boolean
  /**
   * Log level.
   *
   * @default 'info'
   */
  logLevel?: LogLevel
  /**
   * Path relative to `root` where to find the images to use for generating PWA assets.
   *
   * PWA Assets will be generated in the same directory.
   */
  images?: string | string[]
  /**
     * Preset to use.
     *
     * @default 'minimal'
     */
  preset?: BuiltInPreset | Preset
}

export interface ResolvedConfig extends Required<Omit<UserConfig, 'preset'>> {
  preset: Preset
}

export function defineConfig(config: UserConfig): UserConfig {
  return config
}

export async function loadConfig<U extends UserConfig>(
  // eslint-disable-next-line n/prefer-global/process
  cwd = process.cwd(),
  configOrPath: string | U = cwd,
  extraConfigSources: LoadConfigSource[] = [],
  defaults: UserConfig = { overrideAssets: true, logLevel: 'info' },
): Promise<LoadConfigResult<U>> {
  let inlineConfig = {} as U
  if (typeof configOrPath !== 'string') {
    inlineConfig = configOrPath
    if (inlineConfig.config === false) {
      return {
        config: inlineConfig as U,
        sources: [],
      }
    }
    else {
      // eslint-disable-next-line n/prefer-global/process
      configOrPath = inlineConfig.config || process.cwd()
    }
  }

  const resolved = resolve(cwd, configOrPath)

  let isFile = false
  if (existsSync(resolved) && statSync(resolved).isFile()) {
    isFile = true
    cwd = dirname(resolved).replace(/\\/g, '/')
  }

  const loader = createLoader<U>({
    sources: isFile
      ? [
          {
            files: resolved,
            extensions: [],
          },
        ]
      : [
          {
            files: [
              'pwa-assets.config',
            ],
          },
          ...extraConfigSources,
        ],
    cwd,
    defaults: inlineConfig,
  })

  const result = await loader.load()
  result.config = Object.assign(defaults, result.config || inlineConfig)

  return result
}
