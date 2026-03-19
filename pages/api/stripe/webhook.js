import Stripe from 'stripe'
import { adminDb, FieldValue } from '../../../lib/firebaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const config = { api: { bodyParser: false } }

async function buffer(readable) {
  const chunks = []
  for await (const chunk of readable) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

const CREDIT_PACKS = {
  'credits_100':  100,
  'credits_500':  500,
  'credits_1200': 1200,
}
const SUB_CREDITS = { pro: 500, ultra: 1500 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return res.status(400).json({ error: `Webhook error: ${e.message}` })
  }

  const session   = event.data.object
  const uid       = session.metadata?.uid
  const productId = session.metadata?.productId

  if (!uid) return res.status(400).json({ error: 'Missing uid in metadata' })

  const ref = adminDb.collection('users').doc(uid)

  try {
    if (event.type === 'checkout.session.completed') {
      if (CREDIT_PACKS[productId]) {
        await ref.update({ credits: FieldValue.increment(CREDIT_PACKS[productId]) })
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const plan = productId?.includes('ultra') ? 'ultra' : productId?.includes('pro') ? 'pro' : null
      if (plan) {
        const expiry = new Date()
        expiry.setMonth(expiry.getMonth() + 1)
        await ref.update({
          plan,
          credits: FieldValue.increment(SUB_CREDITS[plan]),
          billingCycleEnd: expiry,
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      await ref.update({ plan: 'free', billingCycleEnd: null })
    }

    res.json({ received: true })
  } catch (e) {
    console.error('Webhook processing error:', e)
    res.status(500).json({ error: 'Processing failed' })
  }
}
