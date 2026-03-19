// Server-side auth middleware — pure CommonJS
const { adminAuth, adminDb, FieldValue, _initError } = require('./firebaseAdmin')

async function requireAuth(req) {
  if (_initError || !adminAuth) {
    return { error: `Firebase not initialized: ${_initError ?? 'unknown'}`, status: 500 }
  }

  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 }
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid
    const ref = adminDb.collection('users').doc(uid)
    const doc = await ref.get()

    if (!doc.exists) {
      const newUser = {
        uid, email: decoded.email ?? '',
        plan: 'free', credits: 20,
        createdAt: FieldValue.serverTimestamp(),
        billingCycleEnd: null,
      }
      await ref.set(newUser)
      return { user: { uid, ...newUser } }
    }

    return { user: { uid, ...doc.data() } }
  } catch (e) {
    return { error: 'Invalid token', status: 401 }
  }
}

module.exports = { requireAuth }
