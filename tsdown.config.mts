import { promises as fs } from 'node:fs'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/{index,cli,config}.ts',
    'src/api/{index,instructions,generate-assets,generate-html-markup,generate-manifest-icons-entry}.ts',
    'src/presets/*.ts',
  ],
  dts: true,
  publint: {
    level: 'error',
  },
  attw: {
    profile: 'strict',
    level: 'error',
    ignoreRules: ['cjs-resolves-to-esm'],
  },
  define: {
    'import.meta.vitest': 'false',
  },
  hooks: {
    'build:done': async () => {
      await fs.unlink('./dist/cli.d.mts')
    },
  },
})
