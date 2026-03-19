// Firebase ADMIN SDK
// eval() bypasses webpack's module bundling — firebase-admin must load via native Node.js require
let _admin = null
let _initError = null

try {
  // eslint-disable-next-line no-eval
  const admin = eval("require('firebase-admin')")
  _admin = admin

  if (!admin.apps.length) {
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
  }
} catch (e) {
  _initError = e.message
  console.error('[firebaseAdmin] init error:', e.message)
}

const adminDb      = _admin?.apps?.length ? _admin.firestore() : null
const adminAuth    = _admin?.apps?.length ? _admin.auth()      : null
const adminStorage = _admin?.apps?.length ? _admin.storage()   : null
const FieldValue   = _admin?.firestore?.FieldValue ?? null

module.exports = { adminDb, adminAuth, adminStorage, FieldValue, _initError }
