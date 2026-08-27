import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore'

const WEBSITE_DATA_PATH = '../fishfarm-website/src/data/farm-data.js'

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key)

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`)
  console.error('Example usage:')
  console.error('FIREBASE_API_KEY=... FIREBASE_PROJECT_ID=... npm run seed')
  process.exit(1)
}

const app = initializeApp(config)
const db = getFirestore(app)

const source = readFileSync(new URL(WEBSITE_DATA_PATH, import.meta.url), 'utf8')
const data = extractFarmData(source)

function extractFarmData(source) {
  const jsonStart = source.indexOf('{')
  const jsonEnd = source.lastIndexOf('}')
  const objectLiteral = source.slice(jsonStart, jsonEnd + 1)
  return Function(`"use strict"; const FARM_DATA = ${objectLiteral}; return FARM_DATA`)()
}

async function collectionIsEmpty(name) {
  const snapshot = await getDocs(collection(db, name))
  return snapshot.empty
}

async function seedCollection(name, entries) {
  const fields = entries.map((entry, index) => {
    const { id, ...rest } = entry
    return { order: index + 1, ...rest }
  })

  const batch = writeBatch(db)
  fields.forEach((entry) => {
    batch.set(doc(collection(db, name)), entry)
  })
  await batch.commit()
  console.log(`Seeded ${fields.length} documents into ${name}`)
}

const { fishes, gallery, videos, ...settings } = data

const settingsPayload = { ...settings }
delete settingsPayload.fishes
delete settingsPayload.gallery
delete settingsPayload.videos

await setDoc(doc(db, 'site', 'settings'), settingsPayload, { merge: true })
console.log('Seeded site/settings')

for (const [name, entries] of [['fishes', fishes], ['gallery', gallery], ['videos', videos]]) {
  if (await collectionIsEmpty(name)) {
    await seedCollection(name, entries)
  } else {
    console.log(`Skipped ${name} (already has documents)`)
  }
}

console.log('Done')
