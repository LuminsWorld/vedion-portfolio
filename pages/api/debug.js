// Standalone debug — does NOT import firebaseAdmin module, tests inline
export default async function handler(req, res) {
  const result = {
    nodeVersion: process.version,
    env: {
      FIREBASE_PRIVATE_KEY:    process.env.FIREBASE_PRIVATE_KEY    ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : 'MISSING',
      FIREBASE_CLIENT_EMAIL:   process.env.FIREBASE_CLIENT_EMAIL   ?? 'MISSING',
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ?? 'MISSING',
    },
    requireTest: null,
    initTest: null,
  }

  // Test 1: can we even require firebase-admin?
  try {
    const admin = eval("require('firebase-admin')")
    result.requireTest = `OK — apps: ${admin.apps.length}`

    // Test 2: can we init?
    if (!admin.apps.length) {
      let pk = process.env.FIREBASE_PRIVATE_KEY ?? ''
      if (pk.includes('\\n')) pk = pk.replace(/\\n/g, '\n')
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: 'vedion-978cc',
          privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID ?? '',
          privateKey: pk,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
        }),
      })
    }
    result.initTest = `OK — apps: ${admin.apps.length}`
  } catch (e) {
    result.requireTest = `FAILED: ${e.message}`
    result.errorStack = e.stack?.split('\n').slice(0, 8).join(' | ')
  }

  res.json(result)
}
