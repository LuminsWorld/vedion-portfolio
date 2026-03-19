import { adminDb, _initError } from '../../lib/firebaseAdmin'

export default function handler(req, res) {
  res.json({
    firebaseReady: !!adminDb,
    initError: _initError,
    envVars: {
      FIREBASE_PRIVATE_KEY:    process.env.FIREBASE_PRIVATE_KEY    ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : 'MISSING',
      FIREBASE_CLIENT_EMAIL:   process.env.FIREBASE_CLIENT_EMAIL   ?? 'MISSING',
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ?? 'MISSING',
      ANTHROPIC_API_KEY:       process.env.ANTHROPIC_API_KEY       ? 'SET' : 'MISSING',
      GEMINI_API_KEY:          process.env.GEMINI_API_KEY          ? 'SET' : 'MISSING',
    }
  })
}
