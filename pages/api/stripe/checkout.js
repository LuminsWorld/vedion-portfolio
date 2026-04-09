import Stripe from 'stripe'
import { requireAuth } from '../../../lib/authMiddleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-04-10' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vedion.cloud'

// Inline product definitions — no pre-created Stripe products needed
const ITEMS = {
  credits_100:       { name: '100 Credits',             amount: 299,  mode: 'payment',      meta: { type: 'credits', credits: '100' } },
  credits_500:       { name: '500 Credits',             amount: 999,  mode: 'payment',      meta: { type: 'credits', credits: '500' } },
  credits_1200:      { name: '1200 Credits',            amount: 1999, mode: 'payment',      meta: { type: 'credits', credits: '1200' } },
  sub_pro:           { name: 'Pro Plan',                amount: 999,  mode: 'subscription', meta: { type: 'subscription', plan: 'pro',   credits: '500' } },
  sub_ultra:         { name: 'Ultra Plan',              amount: 1999, mode: 'subscription', meta: { type: 'subscription', plan: 'ultra', credits: '1500' } },
  screen_share:      { name: 'Vedion Screen Share',     amount: 1999, mode: 'payment',      meta: { type: 'screen_share' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { user, error, status } = await requireAuth(req)
    if (error) return res.status(status).json({ error })

    const { itemId } = req.body ?? {}
    const item = ITEMS[itemId]
    if (!item) return res.status(400).json({ error: 'Invalid item' })

    const priceData = {
      currency: 'usd',
      product_data: { name: item.name },
      unit_amount: item.amount,
      ...(item.mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
    }

    const session = await stripe.checkout.sessions.create({
      mode: item.mode,
      payment_method_types: ['card'],
      line_items: [{ price_data: priceData, quantity: 1 }],
      success_url: `${APP_URL}/shop?payment=success`,
      cancel_url:  `${APP_URL}/shop?payment=cancelled`,
      client_reference_id: user.uid,
      metadata: { uid: user.uid, ...item.meta },
      customer_email: user.email,
    })

    res.json({ url: session.url })
  } catch (e) {
    console.error('[stripe/checkout]', e)
    res.status(500).json({ error: e.message })
  }
}
