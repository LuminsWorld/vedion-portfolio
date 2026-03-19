// Simple test — no Firebase, just verifies API routing works
export default function handler(req, res) {
  res.json({ ok: true, env: {
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30) ?? 'MISSING',
  }})
}
