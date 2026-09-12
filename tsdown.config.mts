import { promises as fs } from 'node:fs'
import { defineConfig } from 'tsdown'

/*
{ input: 'src/index', name: 'index' },
    { input: 'src/config', name: 'config' },
    { input: 'src/presets/index', name: 'presets' },
    { input: 'src/presets/minimal', name: 'presets/minimal' },
    { input: 'src/presets/minimal-2023', name: 'presets/minimal-2023' },
    { input: 'src/api/index', name: 'api' },
    { input: 'src/api/instructions', name: 'api/instructions' },
    { input: 'src/api/generate-assets', name: 'api/generate-assets' },
    { input: 'src/api/generate-html-markup', name: 'api/generate-html-markup' },
    { input: 'src/api/generate-manifest-icons-entry', name: 'api/generate-manifest-icons-entry' },
    { input: 'src/cli', name: 'cli' },
 */
export default defineConfig({
  entry: [
    'src/{index,cli,config}.ts',
    'src/api/{index,instructions,generate-assets,generate-html-markup,generate-manifest-icons-entry}.ts',
    'src/presets/*.ts',
  ],
  dts: true,
  define: {
    'import.meta.vitest': 'false',
  },
  hooks: {
    'build:done': async () => {
      await fs.unlink('./dist/cli.d.mts')
    },
  },
})
