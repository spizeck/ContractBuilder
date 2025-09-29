// scripts/migrateDives.ts
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import * as admin from 'firebase-admin'

// ---------- Admin SDK init ----------
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(__dirname, '../config/service-account.json')
    ),
    projectId: 'seasabacontracts'
  })
}
const db = admin.firestore()

// ----------- Migration Mapping ----------
const diveNumberToSlot: Record<number, string> = {
  1: '9am',
  2: '11am',
  3: '1pm',
  4: '3pm',
  5: 'night'
}

const boatNameToId: Record<string, string> = {
  'Fin & Tonic': '4P7CPARyRnL80XRwUYsI',
  'Shark Bait': 'sSm0yTHAqZEUx5oPJIah',
  'Northern Sky': 'suYFPeHSob9qNAO8xX5C',
  'Private Boat': '8W0X82ci2zYCOMQSwZJv'
}

const diveSiteNameToId: Record<string, string> = {
  'Mt. Michel': 'JHcHxQAosKFzLkZGf6pV',
  'Third Encounter': 'AIZNojoZfzbwkajubdFO',
  'Twilight Zone': 'VHJAx05ydYfuodB2Ry5a',
  'Outer Limits': 'ocGPwl6OrSSOV5JBjtwI',
  'Shark Shoals': 'umWfK4cNVvU84Z1Cfr59',
  'Diamond Rock': 'SBixrG2NBtkWPiiAZCxV',
  "Man O'War Shoals": 'h8JUqKDQ2Oj6L3xhqeFf',
  'Otto Limits': 'SF99rGkPtk85r3XDB8wq',
  'Torrens Point': '7EDEE7oUaKB0MA6o0XT7',
  'Customs House': 'UTPwrHy7yWu2sH93MS1X',
  'Porites Point': 'Yu90Xf8WUKtvDchPQmJ',
  "Babylon": 'KHNChsPnWPKA3UggWPZW',
  'Ladder Labyrinth': '0PM4JjUGJFsbK13TpbgR',
  '50/50': 'LVTM6oD1LbLCnnZFMj8A',
  'Hot Springs': 'qUh5MTOhs10EyT0TcC2d',
  'Rays and Anchors': 'RKpAXbuHzHYsDZ5XqZ0O',
  'Ladder Drift': '7NTJYhqmOvdKH870KGyh',
  'Tedran Wall': 'J12OjQcq6AM4JA4zRpyU',
  'Tent Reef Wall': 'M2sJETSQDfHBLoEV0IXt',
  'Tent Boulders': 'SEdXr1hDw28RC4dWCgHQ',
  'Tent Reef': 'DgHluv4sYU4fmvAVannk',
  'Tent Deep': 'YwurcEWsJfmXBy3pas9Y',
  'Tent Shallow': '5LRO7pahWieR4lzVmCm4',
  'Tent Drift': '4SAP4TP0JCjKMLPcFFQR',
  'Muck Dive': 'fIepSBN4gvkEB9shVW73',
  'Greer Gut': 'KAMEfTSs5VZzrqxSodDM',
  'Big Rock Market': '3Suj6fOnINkSqstspdQl',
  'Big Rock Deep': 'xLNWkUyUxrFN7YnnvYma',
  'Otto Zone': 'qxVgVkegQ8HKH0HWa02Y',
  'Hole in the Corner': 'cqLDkjxarlR0PyPn0rS7',
  "Abraham's Hole": 'fF4WfDDAYkS6xAEuEGEw',
  "David's Drop-off Deep": 'A4cQPZ5Ni4e77wxcIbqr',
  'Core Gut': 'qJkf7jF3XCgLCAwDVEU6',
  'Old Booby Hill': 'YYTRSFKO1vFBirJ2KyYw',
  'Cove Bay': 'a9nzlPbNfiyNzUdlxKSv',
  'End of the Runway': 'gndhMx45hyV6AXaSh5w8',
  'Airport Drift': 'ScJesbrClixCM85b1RAg',
  'Spanish Town': '4zW6wfotrLR0gzWU9yPf',
  'Great Backyard': 'lt1MoevAcWRq02LBancu',
  'Green Island': 'SlBnjhO2WaO4VKXxW1ek',
  'Great Point Drift': 'mtA45t7jx2pVxGgmMGEx',
  'Ghost Wreck': '0Edv7TRAPWsQRMKD5731',
  "Blackwater": 'vfDnhUvVmKqbqqfeWcXg'
}

const speciesNameToId: Record<string, string> = {
  'Green Turtle': 'kbv9rQDyxdvBSDJQw15j',
  'Hawksbill Turtle': 'QUGnVRq8ePB1Uz82PxCt',
  'Caribbean Reef Shark': 'y3TFNnYoKq4AkSRnjDrG',
  'Blacktip Reef Shark': 'KrleF9UpXDs3orEASYgR',
  'Nurse Shark': 'IGY6TTGJUqM80YT71Q36',
  'Roughtail Stingray': 'Dm7cdRHmFc0NyPUyJI9B',
  'Southern Stingray': 'mjyMvpaSKak1WBRlvWTG',
  'Spotted Eagle Ray': 'ncFDJwqyMg3J46wuxEt8',
  'Nassau Grouper': 'HIM2AZGghWfTLIEegcvE',
  'Yellowfin Grouper': '8pgHBifYmnfrmdheR65n',
  'Tiger Grouper': 'fygJv8S8ZWCGeob5KAuz',
  'Longspine Sea Urchin': 'okuRdfl05dk4svdAGolB',
  'Sea Egg': 'N6kL4lZXXTKAth8ha0eq',
  'Pencil Urchin': 'HiI5jBK8rtGIfxks6LrU',
  'Magnificent Urchin': '9oiP9A3J6YBAetiu6ROd',
  'Reef Urchin': 'ZhUhn0P6dyNxMtSkQQ6a',
  'Variegated Urchin': 'KEaaDIBLNSoJ75YEvQ8K',
  'Red-tipped Sea Goddess': 'wUDtZ0BLBkzen7CgdmDo',
  'Lettuce Sea Slug': 'vhNE8LghvtZfDz9J8sWR',
  'Leech Head Shield Slug': 'iDrNcNSRJ2xtIVFcImmA',
  'Flamingo Tongue': 'hVWb4Mrl3jdazscjfQsC',
  'Fingerprint Cyphoma': '1BBh5KrZOHESdu5a1RxM',
  'White-nosed Pipefish': 'akr4rs2lY02Hsy9aZicf',
  'Long Snout Seahorse': 'nkBCgywEqk5Qs6P2wXZX',
  'Longlure Frogfish': '3tzqUTwPZuEkmvhxdBGf',
  'Red-lipped Batfish': 'GLscoAE66wpHUwDwCqyh',
  'Flying Gurnard': 'RGjwf9DMJfftgg2H2Drd',
  'Lionfish Alive': 'qrvh7OmyNfQHdXOh90sh',
  'Lionfish Dead': '4EnoaqYcz6af5feEtt1F'
}

// --------- Types ----------
interface CsvRow {
  id: string
  date: string
  dive_number: string
  boat: string
  dive_guide: string
  dive_site: string
  max_depth: string
  water_temperature: string
  sightings: string // JSON string
}

interface SightingsRow {
  species: string
  count: string | number
}

// ---------- Helpers ----------
function utcMidnight (dateStr: string): admin.firestore.Timestamp {
  return admin.firestore.Timestamp.fromDate(new Date(`${dateStr}T00:00:00Z`))
}
function toNumberOrNull (v: string | number | null): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = parseInt(String(v).trim(), 10)
  return Number.isFinite(n) ? n : null
}
async function loadCsv (): Promise<CsvRow[]> {
  const rows: CsvRow[] = []
  const filePath = path.resolve('scripts/dives.csv')
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CsvRow) => rows.push(row))
      .on('end', resolve)
      .on('error', reject)
  })
  return rows
}

function buildDiveData (row: CsvRow) {
  let sightings: { speciesId: string; count: number }[] = []

  try {
    const parsed = JSON.parse(
      (row.sightings || '').replace(/""/g, '"')
    ) as SightingsRow[]
    if (Array.isArray(parsed)) {
      sightings = parsed
        .map(s => ({
          speciesId: speciesNameToId[s.species] || 'unknown',
          count: toNumberOrNull(s.count)
        }))
        .filter(s => s.count !== null && s.count > 0) as {
        speciesId: string
        count: number
      }[]
    }
  } catch {
    console.warn(`⚠️ Could not parse sightings for dive ${row.id}`)
  }

  return {
    date: utcMidnight(row.date),
    diveSlot: diveNumberToSlot[Number(row.dive_number)] || 'unknown',

    // ✅ use Id field names
    boatId: boatNameToId[(row.boat || '').trim()] || 'unknown',
    diveGuide: row.dive_guide || '',
    diveSiteId: diveSiteNameToId[(row.dive_site || '').trim()] || 'unknown',

    maxDepth: parseFloat(row.max_depth),
    waterTemperature: parseFloat(row.water_temperature),

    sightings, // ✅ now { speciesId, count }

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'migration-script'
  }
}

// ---------- Preview ----------
async function previewMigration () {
  const rows = await loadCsv()
  console.log(`✅ Read ${rows.length} rows`)
  if (rows.length === 0) return
  const first = rows[0]
  console.log('\n📄 First CSV row:')
  console.log(first)
  const diveData = buildDiveData(first)
  console.log('\n🔥 Converted Firestore object:')
  console.log(JSON.stringify(diveData, null, 2))
}

// ---------- Migration ----------
async function migrate () {
  const rows = await loadCsv()
  console.log(`✅ Read ${rows.length} rows`)
  let batch = db.batch()
  let batchCount = 0
  let totalWritten = 0

  for (const row of rows) {
    const diveData = buildDiveData(row)
    const divesCol = db.collection('dives')
    const diveRef =
      row.id && String(row.id).trim()
        ? divesCol.doc(String(row.id).trim())
        : divesCol.doc()
    batch.set(diveRef, diveData, { merge: true })
    batchCount++

    if (batchCount >= 400) {
      await batch.commit()
      totalWritten += batchCount
      console.log(`🚀 Committed ${batchCount} docs (total ${totalWritten})`)
      batch = db.batch()
      batchCount = 0
    }
  }
  if (batchCount > 0) {
    await batch.commit()
    totalWritten += batchCount
    console.log(`🚀 Committed final ${batchCount} docs (total ${totalWritten})`)
  }
  console.log('🎉 Migration complete!')
}

// ---------- Entry point ----------
const isPreview = process.argv.includes('--preview')

if (isPreview) {
  previewMigration().catch(err => {
    console.error('❌ Preview failed:', err)
    process.exitCode = 1
  })
} else {
  migrate().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exitCode = 1
  })
}

// To run preview:    npx ts-node scripts/migrateDives.ts --preview
// To run migration:  npx ts-node scripts/migrateDives.ts
// (Make sure you have your GOOGLE_APPLICATION_CREDENTIALS env var set)
