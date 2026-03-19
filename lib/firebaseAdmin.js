// Firebase ADMIN SDK (server-side / API routes only)
import admin from 'firebase-admin'

let _initError = null

function initAdmin() {
  if (admin.apps.length) return
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? ''
    // Vercel sometimes double-escapes \n — fix it
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        type: 'service_account',
        project_id: 'vedion-978cc',
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID ?? '',
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL ?? '',
        client_id: process.env.FIREBASE_CLIENT_ID ?? '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
      }),
      storageBucket: 'vedion-978cc.firebasestorage.app',
    })
  } catch (e) {
    _initError = e.message
    console.error('Firebase Admin init failed:', e.message)
  }
}

initAdmin()

const adminDb   = admin.apps.length ? admin.firestore() : null
const adminAuth = admin.apps.length ? admin.auth() : null

export { admin, adminDb, adminAuth, _initError }
