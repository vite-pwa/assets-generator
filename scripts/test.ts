import { generateTransparentAsset } from '../src/api'

const result = await generateTransparentAsset(
  'png',
  'playground/pwa/public/favicon.svg',
  512, {
    padding: 0.1,
    resizeOptions: { fit: 'contain' },
    outputOptions: { compressionLevel: 9, quality: 60 },
  },
)

result.toFile('playground/pwa/public/test1.png')
