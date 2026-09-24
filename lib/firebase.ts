import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, type User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const isConfigured = Object.values(firebaseConfig).every((value) => Boolean(value && value !== 'undefined'))

export const firebaseApp = isConfigured ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null
export const storage = firebaseApp ? getStorage(firebaseApp) : null

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null)
    return () => undefined
  }

  return onAuthStateChanged(auth, callback, () => callback(null))
}

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error('Firebase is not configured.')
  }

  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

/**
 * Recursively strips undefined keys and nested undefined properties from objects
 * so Firestore setDoc() and addDoc() operations never fail with "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value)
      }
    }
    return sanitized as T
  }

  return data
}
