import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyANF9EYJ0Ba8M1ePaebJ5wlYBJXo24hcPo",
    authDomain: "merofishfarm.firebaseapp.com",
    projectId: "merofishfarm",
    storageBucket: "merofishfarm.firebasestorage.app",
    messagingSenderId: "177074178346",
    appId: "1:177074178346:web:355a299d4f655a7d2f3653"
}

export function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.appId)
}

let app
let auth
let db

function ensureInitialized() {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG)
    auth = getAuth(app)
    db = getFirestore(app)
  }
  return { auth, db }
}

export function watchAuth(callback) {
  const { auth } = ensureInitialized()
  return onAuthStateChanged(auth, callback)
}

export function signIn(email, password) {
  const { auth } = ensureInitialized()
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOutUser() {
  const { auth } = ensureInitialized()
  return signOut(auth)
}

export function currentUserEmail() {
  return auth?.currentUser?.email ?? ''
}

export async function loadSettings() {
  const { db } = ensureInitialized()
  const snapshot = await getDoc(doc(db, 'site', 'settings'))
  return snapshot.exists() ? snapshot.data() : {}
}

export function saveSettings(values) {
  const { db } = ensureInitialized()
  return setDoc(doc(db, 'site', 'settings'), values, { merge: true })
}

async function fetchCollection(name) {
  const { db } = ensureInitialized()
  const snapshot = await getDocs(query(collection(db, name), orderBy('order', 'asc'), limit(100)))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
}

export function loadFishes() {
  return fetchCollection('fishes')
}

export function loadGallery() {
  return fetchCollection('gallery')
}

export function loadVideos() {
  return fetchCollection('videos')
}

export async function createEntry(collectionName, values) {
  const { db } = ensureInitialized()
  const reference = await addDoc(collection(db, collectionName), values)
  return reference.id
}

export function updateEntry(collectionName, id, values) {
  const { db } = ensureInitialized()
  return updateDoc(doc(db, collectionName, id), values)
}

export function deleteEntry(collectionName, id) {
  const { db } = ensureInitialized()
  return deleteDoc(doc(db, collectionName, id))
}
