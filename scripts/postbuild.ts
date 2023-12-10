import { rmSync } from 'node:fs'

rmSync('./dist/cli.cjs')
rmSync('./dist/cli.d.cts')
rmSync('./dist/cli.d.mts')
rmSync('./dist/cli.d.ts')
