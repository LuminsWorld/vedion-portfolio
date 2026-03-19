// Firebase ADMIN SDK — modular v12
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'

let _initError = null

if (!getApps().length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? ''
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    initializeApp({
      credential: cert({
        projectId:    'vedion-978cc',
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID ?? '',
        privateKey,
        clientEmail:  process.env.FIREBASE_CLIENT_EMAIL ?? '',
      }),
      storageBucket: 'vedion-978cc.firebasestorage.app',
    })
  } catch (e) {
    _initError = e.message
    console.error('Firebase Admin init error:', e.message)
  }
}

const adminDb      = getApps().length ? getFirestore() : null
const adminAuth    = getApps().length ? getAuth()      : null
const adminStorage = getApps().length ? getStorage()   : null

export { adminDb, adminAuth, adminStorage, FieldValue, _initError }
