/**
 * Downloads the photos currently hotlinked from Figma's asset CDN
 * (those URLs expire ~7 days after export) into /public/assets and
 * rewrites index.html to point at the local copies.
 *
 * Run once, locally:  npm run assets
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const PHOTOS = {
  'hero':           'https://www.figma.com/api/mcp/asset/c3dafe69-694c-4393-ad22-4a60ddd83e45',
  'about':          'https://www.figma.com/api/mcp/asset/c9814ee2-977b-4079-bdf0-6a477f0e1ce6',
  'gallery-1':      'https://www.figma.com/api/mcp/asset/a03e5f43-33a6-4b84-b213-4634ea5c878c',
  'gallery-2':      'https://www.figma.com/api/mcp/asset/b84dd7f5-0503-4378-8317-b0d1c40d5d84',
  'gallery-3':      'https://www.figma.com/api/mcp/asset/f888bd5d-a087-488c-8713-7e65a8ece884',
  'stories-wide':   'https://www.figma.com/api/mcp/asset/d13370e3-3c81-4af5-98d1-645d97535f23',
  'stories-tall-1': 'https://www.figma.com/api/mcp/asset/52d381c7-6d8f-4fdc-a8dc-7600d3fcbd9d',
  'stories-tall-2': 'https://www.figma.com/api/mcp/asset/f35e953d-bf8e-4d70-a8c3-aa3ea3bd15ba',
  'stories-tall-3': 'https://www.figma.com/api/mcp/asset/132c1dc4-7539-4a0f-8d80-1a2ad7231b8a',
  'stories-tall-4': 'https://www.figma.com/api/mcp/asset/b04a7f6b-47cf-4aa6-b210-64c330b58f13',
}

const BHS_NODES = {
  'bhs-hero':        '67:72',
  'bhs-strip-1':     '129:145',
  'bhs-strip-2':     '129:144',
  'bhs-strip-3':     '97:7',
  'bhs-strip-4':     '129:152',
  'bhs-strip-5':     '129:156',
  'bhs-duo-wide':    '129:149',
  'bhs-duo-narrow':  '129:150',
  'bhs-full':        '129:148',
}

const EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

const root = path.resolve(new URL('..', import.meta.url).pathname)
const outDir = path.join(root, 'public', 'assets')
const htmlPath = path.join(root, 'index.html')

await mkdir(outDir, { recursive: true })
let html = await readFile(htmlPath, 'utf8')
let failed = 0

for (const [name, url] of Object.entries(PHOTOS)) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const type = res.headers.get('content-type')?.split(';')[0] ?? ''
    const ext = EXT[type] ?? 'jpg'
    const file = `${name}.${ext}`
    await writeFile(path.join(outDir, file), Buffer.from(await res.arrayBuffer()))
    html = html.replaceAll(url, `/assets/${file}`)
    console.log(`✓ ${file}`)
  } catch (err) {
    failed++
    console.error(`✗ ${name} — ${err.message}`)
  }
}

await writeFile(htmlPath, html)

// Download Barcelona High School project page images if FIGMA_TOKEN is available
const figmaToken = process.env.FIGMA_TOKEN
if (figmaToken) {
  console.log('\nFetching BHS images from Figma API...')
  try {
    const nodeIds = Object.values(BHS_NODES).join(',')
    const figmaFileKey = 'k8FkYaclFX7V8l4AbJI9To'
    const res = await fetch(`https://api.figma.com/v1/images/${figmaFileKey}?ids=${nodeIds}&format=jpg`, {
      headers: { 'X-Figma-Token': figmaToken }
    })
    if (!res.ok) throw new Error(`Figma API returned ${res.status}`)
    const data = await res.json()
    if (!data.images) throw new Error(data.err || 'No images returned')

    for (const [name, nodeId] of Object.entries(BHS_NODES)) {
      const url = data.images[nodeId]
      if (!url) {
        console.error(`✗ bhs: ${name} — node ${nodeId} not found in Figma response`)
        failed++
        continue
      }
      try {
        const imgRes = await fetch(url)
        if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`)
        const file = `${name}.jpg`
        await writeFile(path.join(outDir, file), Buffer.from(await imgRes.arrayBuffer()))
        console.log(`✓ ${file}`)
      } catch (err) {
        failed++
        console.error(`✗ bhs: ${name} — ${err.message}`)
      }
    }
  } catch (err) {
    failed++
    console.error(`✗ Failed to fetch BHS images: ${err.message}`)
  }
} else {
  console.log('\n⚠️ FIGMA_TOKEN not set. Skipping Barcelona High School project image downloads.')
  console.log('To download BHS project images, run: FIGMA_TOKEN=your_figma_token npm run assets\n')
}

console.log(failed
  ? `\nDone with ${failed} failure(s).`
  : '\nDone. Assets downloaded and mapped successfully.')
