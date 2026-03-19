// Service account OAuth token via Google APIs — pure fetch, no native modules
import { SignJWT, importPKCS8 } from 'jose'

let _token = null
let _expiry = 0

export async function getServiceAccountToken() {
  if (_token && Date.now() < _expiry - 60000) return _token

  let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? ''
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n')

  const key = await importPKCS8(privateKey, 'RS256')
  const now = Math.floor(Date.now() / 1000)

  const jwt = await new SignJWT({
    iss: process.env.FIREBASE_CLIENT_EMAIL,
    sub: process.env.FIREBASE_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .sign(key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await res.json()
  if (!data.access_token) throw new Error(`OAuth failed: ${JSON.stringify(data)}`)
  _token = data.access_token
  _expiry = Date.now() + (data.expires_in ?? 3600) * 1000
  return _token
}
