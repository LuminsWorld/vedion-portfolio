import Stripe from 'stripe'
import { getDoc, updateDoc, serverTimestamp } from '../../../lib/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-04-10' })

export const config = { api: { bodyParser: false } }

async function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(typeof c === 'string' ? Buffer.from(c) : c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const uid = session.metadata?.uid
    const plan = session.metadata?.plan
    if (uid && plan) {
      const CREDITS = { pro: 500, ultra: 1500 }
      const user = await getDoc(`users/${uid}`)
      await updateDoc(`users/${uid}`, {
        plan,
        credits: (user?.credits ?? 0) + (CREDITS[plan] ?? 0),
        billingCycleEnd: serverTimestamp(),
      })
    }
  }

  res.json({ received: true })
}
