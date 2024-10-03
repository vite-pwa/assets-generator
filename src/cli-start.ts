import type { BuiltInPreset, HeadLinkOptions, UserConfig } from './config.ts'
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'
import cac from 'cac'
import { green, yellow } from 'colorette'
import { consola } from 'consola'
import { version } from '../package.json'
import { generateAssets } from './api/generate-assets.ts'
import { generateHtmlMarkup } from './api/generate-html-markup.ts'
import { generateManifestIconsEntry } from './api/generate-manifest-icons-entry.ts'
import { resolveInstructions } from './api/instructions-resolver.ts'
import { loadConfig } from './config.ts'

interface CliOptions extends Omit<UserConfig, 'preset' | 'images'> {
  preset?: BuiltInPreset
  headLinkOptions?: Omit<HeadLinkOptions, 'resolveSvgName'>
  override?: boolean
  manifest?: boolean
}

export async function startCli(args: string[] = process.argv) {
  const cli = cac('pwa-assets-generator')

  cli
    .version(version)
    .option('-r, --root <path>', 'Root path')
    .option('-c, --config <path>', 'Path to config file')
    .option('-p, --preset <preset-name>', 'Built-in preset name: minimal, android, windows, ios or all')
    .option('-o, --override', 'Override assets? Defaults to true')
    .option('-m, --manifest', 'Generate generate PWA web manifest icons entry? Defaults to true')
    .option('--html [options]', 'Available options: --html.basePath <path>, --html.preset <preset>, --html.xhtml <false|true>, --html.includeId <false|true>')
    .help()
    .command(
      '[...images]',
      'Generate PWA assets from images files',
    )
    .action((images, options) => run(images, options))

  cli.parse(args)
}

function cleanupCliOptions(cliOptions: any) {
  delete cliOptions['--']
  delete cliOptions.r
  delete cliOptions.c
  delete cliOptions.p
  delete cliOptions.o
  delete cliOptions.m
  if (typeof cliOptions.html === 'object') {
    cliOptions.headLinkOptions = { ...cliOptions.html }
    if (typeof cliOptions.headLinkOptions.preset === 'number')
      cliOptions.headLinkOptions.preset = `${cliOptions.headLinkOptions.preset}`
    if (typeof cliOptions.headLinkOptions.xhtml === 'string')
      cliOptions.headLinkOptions.xhtml = cliOptions.headLinkOptions.xhtml === 'true'
    if (typeof cliOptions.headLinkOptions.includeId === 'string')
      cliOptions.headLinkOptions.includeId = cliOptions.headLinkOptions.includeId === 'true'

    delete cliOptions.html
  }
}

async function run(images: string[] = [], cliOptions: CliOptions = {}) {
  consola.log(green(`Zero Config PWA Assets Generator v${version}`))
  consola.start('Preparing to generate PWA assets...')

  cleanupCliOptions(cliOptions)

  const root = cliOptions.root ?? process.cwd()

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
    manifestIconsEntry = true,
  } = config

  const useOverrideAssets = cliOptions.override === false
    ? false
    : overrideAssets
  const useManifestIconsEntry = cliOptions.manifest === false
    ? false
    : manifestIconsEntry

  const useImages = Array.isArray(configImages) ? configImages : [configImages]

  const xhtml = userHeadLinkOptions?.xhtml === true
  const includeId = userHeadLinkOptions?.includeId === true

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
      useOverrideAssets,
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
    if (logLevel !== 'silent') {
      // 3. html markup
      const links = generateHtmlMarkup(instruction)
      if (links.length) {
        consola.start('Generating Html Head Links...')
        // eslint-disable-next-line no-console
        links.forEach(link => console.log(link))
        consola.ready('Html Head Links generated')
      }
      // 4. web manifest icons entry
      if (useManifestIconsEntry) {
        consola.start('Generating PWA web manifest icons entry...')
        // eslint-disable-next-line no-console
        console.log(generateManifestIconsEntry('string', instruction))
        consola.ready('PWA web manifest icons entry generated')
      }
    }
  }

  consola.ready('PWA assets generated')
}
