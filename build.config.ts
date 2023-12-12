import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/index', name: 'index' },
    { input: 'src/config', name: 'config' },
    { input: 'src/presets/index', name: 'presets' },
    { input: 'src/presets/minimal', name: 'presets/minimal' },
    { input: 'src/presets/minimal-2023', name: 'presets/minimal-2023' },
    { input: 'src/api/index', name: 'api' },
    { input: 'src/api/instructions', name: 'api/instructions' },
    { input: 'src/api/generate-assets', name: 'api/generate-assets' },
    { input: 'src/api/generate-html-markup', name: 'api/generate-html-markup' },
    { input: 'src/cli', name: 'cli' },
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
  replace: {
    'import.meta.vitest': 'false',
  },
})
