import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

let db: Firestore | null = null

function env(value: string | undefined) {
  return String(value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
}

function firebaseConfig() {
  return {
    apiKey: env(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: env(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: env(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    appId: env(import.meta.env.VITE_FIREBASE_APP_ID),
    messagingSenderId: env(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  }
}

export function isFirebaseConfigured() {
  const { apiKey, projectId, appId } = firebaseConfig()
  return Boolean(apiKey && projectId && appId)
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase hindi naka-configure (.env).')
  }
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig())
  }
  return getApp()
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null
  return getAuth(getFirebaseApp())
}

export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

export function getProjectId() {
  return firebaseConfig().projectId
}

export async function ensureSignedIn(): Promise<User> {
  const firebaseAuth = getFirebaseAuth()
  if (!firebaseAuth) {
    throw new Error('Firebase hindi naka-configure (.env).')
  }

  await firebaseAuth.authStateReady()

  if (firebaseAuth.currentUser) return firebaseAuth.currentUser

  try {
    await setPersistence(firebaseAuth, browserLocalPersistence)
    const cred = await signInAnonymously(firebaseAuth)
    await firebaseAuth.authStateReady()
    return cred.user
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: string }).code)
        : ''
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Anonymous Auth hindi naka-on. Firebase Console → Authentication → Sign-in method → Anonymous → Enable.',
      )
    }
    if (code === 'auth/admin-restricted-operation') {
      throw new Error(
        'Anonymous sign-in blocked sa project na ito. I-check ang Authentication settings.',
      )
    }
    throw err
  }
}

/** Siguraduhing may valid token bago Firestore read/write. */
export async function prepareAuthForFirestore(): Promise<User> {
  const firebaseAuth = getFirebaseAuth()
  if (!firebaseAuth) {
    throw new Error('Firebase hindi naka-configure (.env).')
  }

  const user = await ensureSignedIn()
  await firebaseAuth.authStateReady()
  const token = await user.getIdToken(true)
  if (!token) {
    throw new Error('Walang auth token — hindi makakapag-write sa Firestore.')
  }
  return user
}

export function permissionDeniedHelp() {
  return (
    'Firestore blocked (permission denied). Sunod-sunod: ' +
    '(1) Firestore → Rules → i-Publish ang rules sa file `firestore.rules`. ' +
    '(2) Authentication → Anonymous → Enable. ' +
    '(3) App Check → Cloud Firestore → i-off ang Enforcement kung naka-on. ' +
    '(4) Google Cloud → Credentials → API key → payagan ang Cloud Firestore API. ' +
    '(5) I-restart ang `npm run dev`.'
  )
}
