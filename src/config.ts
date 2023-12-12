import { existsSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import type { LoadConfigResult, LoadConfigSource } from 'unconfig'
import { createConfigLoader as createLoader } from 'unconfig'
import type { Preset } from './preset.ts'
import type { LogLevel } from './types.ts'
import type { HtmlLinkPreset } from './api'

export type { LoadConfigResult, LoadConfigSource }

export * from './types.ts'
export * from './presets/index.ts'
export * from './splash.ts'
export * from './api/defaults.ts'
export { defaultAssetName } from './utils.ts'

export type { Preset }

/**
 * Built-in presets.
 * - `minimal-2023`: Only generate the bare minimum assets.
 * - `minimal`: Only generate the bare minimum assets (deprecated).
 * - `android`: Generate assets for Android.
 * - `windows`: Generate assets for Windows.
 * - `ios`: Generate assets for iOS.
 * - `all`: `android`, `windows` and `ios` presets combined.
 */
export type BuiltInPreset = 'minimal' | 'minimal-2023' | 'android' | 'windows' | 'ios' | 'all'

export interface HeadLinkOptions {
  /**
   * Base path to generate the html head links.
   *
   * @default '/'
   */
  basePath?: string
  /**
   * The preset to use.
   *
   * If using the built-in presets from CLI (`minimal` or `minimal-2023`), this option will be ignored (will be set to `default` or `2023` for `minimal` and `minimal-2023` respectively).
   *
   * @default 'default'
   */
  preset?: HtmlLinkPreset
  /**
   * By default, the SVG favicon will use the SVG file name as the name.
   *
   * For example, if you provide `public/logo.svg` as the image source, the href in the link will be `<basePath>logo.svg`.
   *
   * @param name The name of the SVG icons.
   */
  resolveSvgName?: (name: string) => string
  /**
   * Generate an id when generating the html head links.
   *
   * @default false
   */
  xhtml?: boolean
  /**
   * Include the id when generating the html head links.
   *
   * @default false
   */
  includeId?: boolean
}

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
  /**
   * Options for generating the html head links for `apple-touch-icon` and favicons.
   */
  headLinkOptions?: HeadLinkOptions
}

export interface ResolvedConfig extends Required<Omit<UserConfig, 'preset'>> {
  preset: Preset
}

export function defineConfig(config: UserConfig): UserConfig {
  return config
}

export async function loadConfig<U extends UserConfig>(
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
