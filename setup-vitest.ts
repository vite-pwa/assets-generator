import sharp from 'sharp'

import { afterEach, beforeEach } from 'vitest'

beforeEach(() => {
  sharp.cache(true)
  sharp.simd(true)
  sharp.concurrency(0)
})

afterEach(() => {
  if (global.gc)
    global.gc()
})
