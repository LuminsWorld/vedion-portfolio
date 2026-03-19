// Firebase ADMIN SDK — pure CommonJS, no ES module syntax
const admin = require('firebase-admin')

let _initError = null

if (!admin.apps.length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? ''
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    admin.initializeApp({
      credential: admin.credential.cert({
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

const adminDb      = admin.apps.length ? admin.firestore() : null
const adminAuth    = admin.apps.length ? admin.auth()      : null
const adminStorage = admin.apps.length ? admin.storage()   : null
const FieldValue   = admin.firestore.FieldValue

module.exports = { admin, adminDb, adminAuth, adminStorage, FieldValue, _initError }
