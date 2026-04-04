import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

const svgPath = join(__dirname, '..', 'public', 'og-image.svg')
const pngPath = join(__dirname, '..', 'public', 'og-image.png')

const svg = readFileSync(svgPath)

sharp(svg)
  .resize(1200, 630)
  .png()
  .toFile(pngPath)
  .then(() => console.log('OG image generated:', pngPath))
  .catch((err: Error) => console.error('Failed:', err))
