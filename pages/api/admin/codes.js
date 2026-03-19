import { setDoc, queryDocs, updateDoc } from '../../../lib/firestore'

const ADMIN_SECRET = process.env.ADMIN_SECRET

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default async function handler(req, res) {
  try {
    // Always return JSON — never let Next.js serve an HTML error page
    res.setHeader('Content-Type', 'application/json')

    if (!ADMIN_SECRET) {
      return res.status(503).json({ error: 'ADMIN_SECRET env var not set on server.' })
    }

    const authHeader = req.headers['authorization'] ?? ''
    if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Wrong secret.' })
    }

    if (req.method === 'POST') {
      const count = Math.min(parseInt(req.body?.count ?? '1'), 50)
      const note  = req.body?.note ?? ''
      const codes = []

      for (let i = 0; i < count; i++) {
        let code
        do { code = randomCode() } while (codes.includes(code))
        codes.push(code)
        await setDoc(`inviteCodes/${code}`, {
          used: false,
          usedBy: null,
          createdAt: new Date().toISOString(),
          note,
        })
      }

      return res.json({ codes })
    }

    if (req.method === 'GET') {
      const docs = await queryDocs('inviteCodes', [])
      return res.json({ codes: docs })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (e) {
    console.error('[admin/codes]', e)
    return res.status(500).json({ error: e.message ?? 'Internal error' })
  }
}
