import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/index', name: 'index' },
    { input: 'src/config', name: 'config' },
    { input: 'src/presets/minimal', name: 'presets/minimal' },
    { input: 'src/api/index', name: 'api' },
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
