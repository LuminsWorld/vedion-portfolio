// Firebase ADMIN SDK (server-side / API routes only)
import admin from 'firebase-admin'

if (!admin.apps.length) {
  let serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)

  // Vercel sometimes double-escapes \n in the private key — fix it
  if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'vedion-978cc.firebasestorage.app',
  })
}

const adminDb   = admin.firestore()
const adminAuth = admin.auth()

export { admin, adminDb, adminAuth }
