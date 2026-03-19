// Auth middleware — jose JWT verification, no firebase-admin
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getDoc, setDoc, serverTimestamp } from './firestore'

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

export async function requireAuth(req) {
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

    if (!existing) {
      const newUser = {
        uid,
        email: payload.email ?? '',
        plan: 'free',
        credits: 20,
        createdAt: serverTimestamp(),
        billingCycleEnd: null,
      }
      await setDoc(`users/${uid}`, newUser)
      return { user: { ...newUser } }
    }

    return { user: { ...existing } }
  } catch (e) {
    return { error: `Auth error: ${e.message}`, status: 401 }
  }
}
