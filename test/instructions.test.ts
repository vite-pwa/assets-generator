import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { minimal2023Preset } from '../src/presets'
import { createAppleSplashScreens } from '../src/splash'
import { resolveInstructions } from '../src/api/instructions-resolver'

describe('instructions', () => {
  it ('resolve instructions', async () => {
    const instructions = await resolveInstructions({
      imageResolver: () => readFile('playground/pwa/public/favicon.svg'),
      imageName: 'playground/pwa/public/favicon.svg',
      preset: 'minimal-2023',
      htmlLinks: {
        xhtml: false,
        includeId: false,
      },
      basePath: '/',
      resolveSvgName: name => basename(name),
    })
    expect(instructions).toMatchSnapshot()
  })
  it ('resolve instructions with apple splash screen icons', async () => {
    const instructions = await resolveInstructions({
      imageResolver: () => readFile('playground/pwa/public/favicon.svg'),
      imageName: 'playground/pwa/public/favicon.svg',
      faviconPreset: '2023',
      preset: {
        ...minimal2023Preset,
        appleSplashScreens: createAppleSplashScreens({
          padding: 0.3,
          resizeOptions: { fit: 'contain', background: 'white' },
          darkResizeOptions: { fit: 'contain', background: 'black' },
          linkMediaOptions: {
            log: true,
            addMediaScreen: true,
            xhtml: true,
          },
        }, ['iPad Air 9.7"']),
      },
      htmlLinks: {
        xhtml: false,
        includeId: false,
      },
      basePath: '/',
      resolveSvgName: name => basename(name),
    })
    expect(instructions).toMatchSnapshot()
  })
  it ('resolve instructions with apple splash screen icons with custom base url', async () => {
    const instructions = await resolveInstructions({
      imageResolver: () => readFile('playground/pwa/public/favicon.svg'),
      imageName: 'playground/pwa/public/favicon.svg',
      faviconPreset: '2023',
      basePath: '/test/',
      preset: {
        ...minimal2023Preset,
        appleSplashScreens: createAppleSplashScreens({
          padding: 0.3,
          resizeOptions: { fit: 'contain', background: 'white' },
          darkResizeOptions: { fit: 'contain', background: 'black' },
          linkMediaOptions: {
            log: true,
            addMediaScreen: true,
            xhtml: true,
          },
        }, ['iPad Air 9.7"']),
      },
      htmlLinks: {
        xhtml: false,
        includeId: false,
      },
      resolveSvgName: name => basename(name),
    })
    expect(instructions).toMatchSnapshot()
  })
})
