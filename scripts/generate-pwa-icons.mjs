import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const publicDir = path.resolve('public')
const sourcePath = path.join(publicDir, 'Logo ADM.png')

async function generateIcon(size, outputName) {
  await sharp(sourcePath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(path.join(publicDir, outputName))
}

async function generateIcons() {
  if (!fs.existsSync(sourcePath)) {
    console.error('Arquivo não encontrado: public/Logo ADM.png')
    process.exit(1)
  }

  fs.mkdirSync(publicDir, { recursive: true })

  await generateIcon(192, 'pwa-192.png')
  await generateIcon(512, 'pwa-512.png')
  await generateIcon(180, 'apple-touch-icon.png')

  console.log('Ícones PWA gerados a partir de Logo ADM.png')
}

void generateIcons()
