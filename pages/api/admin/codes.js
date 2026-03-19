import { setDoc, queryDocs } from '../../../lib/firestore'

const ADMIN_SECRET = process.env.ADMIN_SECRET

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/1/0 (ambiguous)
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'] ?? ''
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'POST') {
    // Generate N codes
    const count = Math.min(parseInt(req.body?.count ?? '1'), 50)
    const codes = []

    for (let i = 0; i < count; i++) {
      let code
      // Retry if collision (extremely unlikely)
      do { code = randomCode() } while (codes.includes(code))
      codes.push(code)
      await setDoc(`inviteCodes/${code}`, {
        used: false,
        usedBy: null,
        createdAt: new Date().toISOString(),
        note: req.body?.note ?? '',
      })
    }

    return res.json({ codes })
  }

  if (req.method === 'GET') {
    // List all codes
    const docs = await queryDocs('inviteCodes', [])
    return res.json({ codes: docs })
  }

  res.status(405).end()
}
