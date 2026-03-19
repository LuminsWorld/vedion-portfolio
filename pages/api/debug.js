// Debug endpoint — shows Firebase init status
import { admin, _initError } from '../../lib/firebaseAdmin'

export default function handler(req, res) {
  res.json({
    firebaseApps: admin.apps.length,
    initError: _initError,
    envVars: {
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars, starts: ${process.env.FIREBASE_PRIVATE_KEY.slice(0,27)})` : 'MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ?? 'MISSING',
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ?? 'MISSING',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
    }
  })
}
