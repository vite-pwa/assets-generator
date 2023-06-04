import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/index', name: 'index' },
    { input: 'src/config', name: 'config' },
    { input: 'src/presets/minimal', name: 'presets/minimal' },
    { input: 'src/cli', name: 'cli' },
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
  },
})
