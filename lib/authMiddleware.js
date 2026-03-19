// Auth middleware — jose JWT verification, no firebase-admin
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getDoc, setDoc, serverTimestamp } from './firestore'

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

export async function requireAuth(req, { requireAccess = false } = {}) {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 }

  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: 'vedion-978cc',
      issuer: 'https://securetoken.google.com/vedion-978cc',
    })

    const uid = payload.sub
    const existing = await getDoc(`users/${uid}`)

    let user
    if (!existing) {
      user = {
        uid,
        email: payload.email ?? '',
        plan: 'free',
        credits: 20,
        accessGranted: false,
        createdAt: serverTimestamp(),
        billingCycleEnd: null,
      }
      await setDoc(`users/${uid}`, user)
    } else {
      user = { ...existing }
    }

    // Block access if requireAccess is set and not granted
    if (requireAccess && !user.accessGranted) {
      return { error: 'Access not granted. Enter an invite code or upgrade.', status: 403, needsAccess: true }
    }

    return { user }
  } catch (e) {
    return { error: `Auth error: ${e.message}`, status: 401 }
  }
}
