import process from 'node:process'
import { basename, dirname, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import cac from 'cac'
import { consola } from 'consola'
import { green, yellow } from 'colorette'
import { version } from '../package.json'
import { loadConfig } from './config.ts'
import type { BuiltInPreset, HeadLinkOptions, UserConfig } from './config.ts'
import { resolveInstructions } from './api/instructions-resolver.ts'
import { generateHtmlMarkup } from './api/generate-html-markup.ts'
import { generateAssets } from './api/generate-assets.ts'

interface CliOptions extends Omit<UserConfig, 'preset' | 'images'> {
  preset?: BuiltInPreset
  headLinkOptions?: HeadLinkOptions
}

export async function startCli(args: string[] = process.argv) {
  const cli = cac('pwa-assets-generator')

  cli
    .version(version)
    .option('-r, --root <path>', 'Root path')
    .option('-c, --config <path>', 'Path to config file')
    .option('-p, --preset <preset-name>', 'Built-in preset name: minimal, android, windows, ios or all')
    .option('-o, --override', 'Override assets? Defaults to true')
    .help()
    .command(
      '[...images]',
      'Generate PWA assets from images files',
    ).action((images, options) => run(images, options))

  cli.parse(args)
}

async function run(images: string[] = [], cliOptions: CliOptions = {}) {
  consola.log(green(`Zero Config PWA Assets Generator v${version}`))
  consola.start('Preparing to generate PWA assets...')

  const root = cliOptions?.root ?? process.cwd()

  const { config } = await loadConfig<UserConfig>(root, cliOptions)

  if (!config.preset)
    throw new Error('No preset found')

  if (images?.length)
    config.images = images

  if (!config.images?.length)
    throw new Error('No images provided')

  const {
    logLevel = 'info',
    overrideAssets = true,
    preset,
    images: configImages,
    headLinkOptions: userHeadLinkOptions,
  } = config

  const useImages = Array.isArray(configImages) ? configImages : [configImages]

  const xhtml = userHeadLinkOptions?.xhtml ?? false
  const includeId = userHeadLinkOptions?.includeId ?? false

  consola.start('Resolving instructions...')
  // 1. resolve instructions
  const instructions = await Promise.all(useImages.map(i => resolveInstructions({
    imageResolver: () => readFile(resolve(root, i)),
    imageName: resolve(root, i),
    originalName: i,
    preset,
    faviconPreset: userHeadLinkOptions?.preset,
    htmlLinks: { xhtml, includeId },
    basePath: userHeadLinkOptions?.basePath ?? '/',
    resolveSvgName: userHeadLinkOptions?.resolveSvgName ?? (name => basename(name)),
  })))

  consola.ready('PWA assets ready to be generated, instructions resolved')
  consola.start(`Generating PWA assets from ${useImages.join(', ')} image${useImages.length > 1 ? 's' : ''}`)

  const log = logLevel !== 'silent'
  for (const instruction of instructions) {
    // 2. generate assets
    consola.start(`Generating assets for ${instruction.originalName}...`)
    await generateAssets(
      instruction,
      overrideAssets,
      dirname(instruction.image),
      log
        ? (message, ignored) => {
            if (ignored)
              consola.log(yellow(message))
            else
              consola.ready(green(message))
          }
        : undefined,
    )
    consola.ready(`Assets generated for ${instruction.originalName}`)
    // 3. html markup
    if (logLevel !== 'silent') {
      const links = generateHtmlMarkup(instruction)
      if (links.length) {
        consola.start('Generating Html Head Links...')
        // eslint-disable-next-line no-console
        links.forEach(link => console.log(link))
        consola.ready('Html Head Links generated')
      }
    }
  }

  consola.ready('PWA assets generated')
}
