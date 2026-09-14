import {execFileSync} from 'node:child_process'
import {existsSync, readFileSync, statSync} from 'node:fs'
import {basename, join} from 'node:path'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-09-14'})

const source = process.argv.slice(2).find((arg) => !arg.startsWith('--'))

if (!source) {
  throw new Error(
    'Pass the Google Takeout ZIP file or the extracted DRAFT folder after --.\n' +
      'Example: npx sanity exec scripts/import-takeout-media.ts --with-user-token -- "C:\\Users\\Byoungjae\\Downloads\\takeout.zip"',
  )
}

if (!existsSync(source)) {
  throw new Error(`Source does not exist: ${source}`)
}

const isZip = statSync(source).isFile() && source.toLowerCase().endsWith('.zip')
const archiveEntries = isZip
  ? execFileSync('tar', ['-tf', source], {encoding: 'utf8', maxBuffer: 50 * 1024 * 1024})
      .split(/\r?\n/)
      .filter(Boolean)
  : []

function readAsset(relativePath: string): Buffer {
  const normalized = relativePath.replace(/\\/g, '/')

  if (isZip) {
    const entry = archiveEntries.find(
      (item) => item.endsWith(`/DRAFT/${normalized}`) || item === `DRAFT/${normalized}`,
    )
    if (!entry) throw new Error(`Could not find ${relativePath} inside the Takeout ZIP.`)
    return execFileSync('tar', ['-xOf', source, entry], {
      encoding: null,
      maxBuffer: 512 * 1024 * 1024,
    })
  }

  const filePath = join(source, ...normalized.split('/'))
  if (!existsSync(filePath)) {
    throw new Error(
      `Could not find ${filePath}. If using an extracted Takeout, pass the DRAFT folder itself.`,
    )
  }
  return readFileSync(filePath)
}

const covers: Record<string, string> = {
  'palpable-night-forest': 'Work/5b329708f2200e54c7631daadbe27104.jpg',
  'silent-suspense': 'Work/36d98c02186c93e57ec58a6aaf670e7f.jpg',
  'blame-o-matic': 'Work/0c846149847db92e65b5a7b7aa8ebd4a.jpg',
  bdti: 'Work/88b256bedbc96de67afa93d6bf3b2bb9.jpg',
  'baseball-matrix': 'Work/4770a1f671f55ef1ad20be505efee0e7.jpg',
  poly: 'Work/348880db30923b8121b8d1e0366be519.jpg',
  stockbox: 'Work/f5d48d264630493a2a69e0cfc8122ee2.jpg',
  clingy: 'Work/f4650e59d16535bd2a07ec165b069c7a.jpg',
  odo: 'Work/8fc4b663a3376424e58a9ed229e6712c.jpg',
  wally: 'Work/05dd91bb16181f4480a0c3401d7fd1a6.jpg',
}

type ProjectImport = {
  title: string
  images: string[]
  sequence: string[]
  videos?: string[]
}

const projects: Record<string, ProjectImport> = {
  'palpable-night-forest': {
    title: 'Palpable Night Forest',
    images: [
      'Palpable Night Forest/5f50d59dbb13b644185f54b98011f9df.jpg',
      'Palpable Night Forest/91022d6649af3681f0f499da9d130a9e.jpg',
      'Palpable Night Forest/1f417d51dc8f676aafd91e1483257877.jpg',
      'Palpable Night Forest/b01a41d679aee4e8aed544f106ee0d34.jpg',
      'Palpable Night Forest/781979820479925bd3c03238e5ce3905.jpg',
    ],
    sequence: ['i0', 'i1', 'i2', 'i3', 'i4', 't0', 't1', 't2', 't3', 't4', 't5', 'v0'],
    videos: ['https://www.youtube.com/watch?v=lw0uc_Rdrbo'],
  },
  'silent-suspense': {
    title: 'Silent Suspense',
    images: [
      'Silent Suspense/42df2bfc74ce8d954994dc6e6aa19294.jpg',
      'Silent Suspense/d8fc84349d6c4f635ea8538a6ab0f223.jpg',
      'Silent Suspense/b818bfe3d8edadd3ec6823c58c217077.jpg',
    ],
    sequence: ['i0', 'i1', 'i2', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 'v0'],
    videos: ['https://www.youtube.com/watch?v=vlJ7Lep5Zp4'],
  },
  'blame-o-matic': {
    title: 'Blame-o-matic',
    images: [
      'Blame-o-matic/dc4a4af239b13e802ed64f808e7923e7.jpg',
      'Blame-o-matic/14058ba255c50a605c3e1b3582cc2221.jpg',
    ],
    sequence: ['i0', 't0', 't1', 't2', 't3', 't4', 't5', 'i1'],
  },
  bdti: {
    title: 'BdTI',
    images: [
      'BdTI/c74e2b607b382cfb1d0363e8f1ef7751.jpg',
      'BdTI/d94aca83a16040fee769bceab77419a4.jpg',
      'BdTI/3c918d31060e57ed8ef46f1355a5d674.jpg',
    ],
    sequence: ['i0', 't0', 't1', 't2', 'i1', 'i2'],
  },
  'baseball-matrix': {
    title: 'Baseball Matrix',
    images: [
      'Baseball Matrix/0dfb04dd8647331a448532e3d08cdba7.jpg',
      'Baseball Matrix/2a523f07bfbd57644c26a137979a8e9f.jpg',
      'Baseball Matrix/67da76c5782eadd4a2758863aa072e9e.jpg',
      'Baseball Matrix/f6117af3e12285adc7eef808721e698b.jpg',
      'Baseball Matrix/a0ed75832209d508fe0b577a23e77197.jpg',
    ],
    sequence: ['i0', 't0', 't1', 't2', 'i1', 'i2', 'i3', 'i4'],
  },
  poly: {
    title: 'Poly',
    images: [
      'Poly/9efc01df23fb434967726ebe50f10910.jpg',
      'Poly/aba866885f96d2a255685761e4d20bda.jpg',
      'Poly/a7d53057838cda084afc829cda6ad8a5.jpg',
      'Poly/0a4eaa6f3d484a7ab640e93de3435d39.jpg',
    ],
    sequence: ['i0', 't0', 't1', 't2', 't3', 'i1', 'i2', 'i3'],
  },
  stockbox: {
    title: 'Stockbox',
    images: [
      'Stockbox/42ee690c7d8df344eaad28c808c3dad9.jpg',
      'Stockbox/63d7f7dee19d9cb6d66236523df98408.jpg',
      'Stockbox/ec00ebde61e4645234bc395882e8972b.jpg',
      'Stockbox/950053d995023765403e3de497dd1e4c.jpg',
    ],
    sequence: ['t0', 'i0', 't1', 't2', 't3', 't4', 'i1', 'i2', 'i3'],
  },
  clingy: {
    title: 'Clingy',
    images: [
      'Clingy/20b6e14cf23977d5aa979aff4b3f2f0c.jpg',
      'Clingy/81b60d055afa234df943efbe80467878.jpg',
      'Clingy/6eba9032034583380168635af7a17ea2.jpg',
      'Clingy/1d1eb4fcc89bbdbf6fe73e65a0413d12.jpg',
      'Clingy/d260738f96581fa070edc873fc5b77fd.jpg',
    ],
    sequence: ['i0', 't0', 't1', 't2', 't3', 'i1', 'i2', 'i3', 'i4'],
  },
  odo: {
    title: 'ODO',
    images: [
      'ODO/b1943494138db9fc9610b433d9d73986.jpg',
      'ODO/cf2e66779ad2de5cae0cc26dbde13716.jpg',
      'ODO/ff1935e7f10e4b75537045727b8a20ba.jpg',
      'ODO/8e5ae376578b826419e35af338ee6ceb.jpg',
      'ODO/cc9264ee89bddfb0c5cdd5d78006e0fc.jpg',
      'ODO/4521b49f9e3de8c996ee3d4e4ee808f5.jpg',
      'ODO/9b4773d06fd447e784ef0996dd3851e9.jpg',
      'ODO/7675b3792992c907ca7b3faec470086d.jpg',
      'ODO/9cb402fd523b2ade30598c49ffe8ba34.jpg',
    ],
    sequence: ['i0', 't0', 't1', 't2', 'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8'],
  },
  wally: {
    title: 'Wally',
    images: [
      'Wally/9689b4cd9ae1dcb4c28b3079f4192e34.jpg',
      'Wally/412b429fde2352eca6861787941f09ed.jpg',
      'Wally/8b88c22c7db343d4350acb8fb6336207.jpg',
      'Wally/4a4362028b30b68f11ef7f2d561aaf97.jpg',
    ],
    sequence: ['i0', 't0', 't1', 't2', 'i1', 'i2', 'i3'],
  },
}

const assetCache = new Map<string, string>()

async function uploadImage(relativePath: string): Promise<string> {
  if (assetCache.has(relativePath)) return assetCache.get(relativePath)!

  const filename = basename(relativePath)
  const existing = await client.fetch<string | null>(
    '*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id',
    {filename},
  )

  if (existing) {
    console.log(`reuse  ${relativePath}`)
    assetCache.set(relativePath, existing)
    return existing
  }

  console.log(`upload ${relativePath}`)
  const asset = await client.assets.upload('image', readAsset(relativePath), {filename})
  assetCache.set(relativePath, asset._id)
  return asset._id
}

function imageValue(assetId: string) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}}
}

async function importBio() {
  const doc = await client.fetch<{_id: string} | null>(
    '*[_type == "bio" && _id in path("drafts.**")][0]{_id}',
  )
  if (!doc) throw new Error('Bio draft not found.')

  const assetId = await uploadImage('Bio/228948c5535a6494fa9e6890c0694caa.jpg')
  await client
    .patch(doc._id)
    .set({
      portrait: {
        ...imageValue(assetId),
        alt: 'Byoungjae Kim at Mt. Daedun-san, South Korea',
        caption: 'Veni, vidi, cepi? A moment at Mt. Daedun-san, South Korea',
      },
    })
    .commit()

  console.log('patched Bio portrait')
}

async function importProject(slug: string, config: ProjectImport) {
  const doc = await client.fetch<{_id: string; body?: any[]} | null>(
    '*[_type == "project" && slug.current == $slug && _id in path("drafts.**")][0]{_id, body}',
    {slug},
  )
  if (!doc) throw new Error(`Project draft not found: ${slug}`)

  const textBlocks = (doc.body || []).filter((block) => block?._type === 'block')
  const neededTextCount =
    Math.max(
      -1,
      ...config.sequence
        .filter((item) => item.startsWith('t'))
        .map((item) => Number(item.slice(1))),
    ) + 1

  if (textBlocks.length < neededTextCount) {
    throw new Error(
      `${config.title}: expected at least ${neededTextCount} text blocks, found ${textBlocks.length}.`,
    )
  }

  const imageAssetIds: string[] = []
  for (const imagePath of config.images) imageAssetIds.push(await uploadImage(imagePath))

  const rebuiltBody = config.sequence.map((item) => {
    const kind = item[0]
    const index = Number(item.slice(1))

    if (kind === 't') return textBlocks[index]
    if (kind === 'i') {
      return {
        _type: 'projectImage',
        _key: `takeout-image-${index}`,
        asset: {_type: 'reference', _ref: imageAssetIds[index]},
        alt: `${config.title} project image ${index + 1}`,
      }
    }
    if (kind === 'v') {
      const url = config.videos?.[index]
      if (!url) throw new Error(`${config.title}: missing video ${index}.`)
      return {_type: 'videoEmbed', _key: `takeout-video-${index}`, url}
    }

    throw new Error(`${config.title}: unknown sequence token ${item}.`)
  })

  const coverAssetId = await uploadImage(covers[slug])

  await client
    .patch(doc._id)
    .set({
      coverImage: imageValue(coverAssetId),
      body: rebuiltBody,
    })
    .commit()

  console.log(`patched ${config.title}`)
}

async function main() {
  console.log(`Import source: ${source}`)
  await importBio()

  for (const [slug, config] of Object.entries(projects)) {
    await importProject(slug, config)
  }

  console.log('\nDone. Bio portrait, Work covers, project images, and YouTube embeds are now attached to the existing drafts.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
