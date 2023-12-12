import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { expect, expectTypeOf, it } from 'vitest'
import { resolveInstructions } from '../src/api/instructions-resolver'
import { generateManifestIconsEntry } from '../src/api/generate-manifest-icons-entry'
import type { ManifestIcons } from '../src/api'

it('should generate manifest icons entry', async () => {
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
  const iconsString = generateManifestIconsEntry('string', instructions)
  expectTypeOf(iconsString).toEqualTypeOf<string>()
  const icons = generateManifestIconsEntry('object', instructions)
  expectTypeOf(icons).toEqualTypeOf<ManifestIcons>()
  expect(icons).toMatchSnapshot()
})
