// Minimal test: does importing firebaseAdmin.js crash?
import { adminDb, adminAuth, _initError } from '../../lib/firebaseAdmin'

export default function handler(req, res) {
  res.json({
    adminDbType: typeof adminDb,
    adminAuthType: typeof adminAuth,
    initError: _initError ?? null,
    imported: true,
  })
}
