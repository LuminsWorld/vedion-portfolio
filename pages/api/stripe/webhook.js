import Stripe from 'stripe'
import { getDoc, updateDoc, setDoc, queryDocs } from '../../../lib/firestore'
import crypto from 'crypto'

function generateLicenseKey() {
  // Format: VDSS-XXXX-XXXX-XXXX-XXXX
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase()
  return `VDSS-${seg()}-${seg()}-${seg()}-${seg()}`
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-04-10' })

export const config = { api: { bodyParser: false } }

async function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(typeof c === 'string' ? Buffer.from(c) : c))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function handleCheckoutComplete(session) {
  const uid     = session.metadata?.uid
  const type    = session.metadata?.type
  const credits = parseInt(session.metadata?.credits ?? '0')
  const plan    = session.metadata?.plan

  if (!uid) return

  const user = await getDoc(`users/${uid}`)
  const currentCredits = user?.credits ?? 0

  if (type === 'screen_share') {
    const licenseKey = generateLicenseKey()
    await setDoc(`licenses/${licenseKey}`, {
      uid,
      email: session.customer_email ?? '',
      product: 'screen_share',
      licenseKey,
      activated: false,
      machineId: null,
      createdAt: new Date().toISOString(),
      stripeSessionId: session.id,
    })
    await updateDoc(`users/${uid}`, { screenShareLicense: licenseKey })
  } else if (type === 'credits') {
    await updateDoc(`users/${uid}`, { credits: currentCredits + credits, accessGranted: true })
  } else if (type === 'subscription') {
    await updateDoc(`users/${uid}`, {
      plan,
      credits: currentCredits + credits,
      accessGranted: true,
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
    })
  }
}

async function handleInvoicePaid(invoice) {
  // Monthly renewal — top up credits
  const customerId = invoice.customer
  if (!customerId) return

  // Find user by stripeCustomerId stored in Firestore (set during checkout completion).
  // We cannot rely on subscription.metadata.uid — metadata is only set on the checkout
  // session, not propagated to the subscription object.
  const users = await queryDocs('users', [{ field: 'stripeCustomerId', value: customerId }])
  const user = users[0]
  if (!user) {
    console.warn(`[webhook] handleInvoicePaid: no user found for customerId ${customerId}`)
    return
  }

  const planCredits = { pro: 500, ultra: 1500 }
  const plan = user.plan ?? 'free'
  const topUp = planCredits[plan] ?? 0

  if (topUp > 0) {
    await updateDoc(`users/${user.id}`, {
      credits: topUp, // Reset to plan allowance each month
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }
}

async function handleSubscriptionCancelled(sub) {
  // Same fix as handleInvoicePaid — uid is not in subscription metadata.
  // Look up user by stripeCustomerId instead.
  const customerId = sub.customer
  if (!customerId) return
  const users = await queryDocs('users', [{ field: 'stripeCustomerId', value: customerId }])
  const user = users[0]
  if (!user) {
    console.warn(`[webhook] handleSubscriptionCancelled: no user found for customerId ${customerId}`)
    return
  }
  await updateDoc(`users/${user.id}`, { plan: 'free', stripeSubscriptionId: null })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (e) {
    return res.status(400).json({ error: `Webhook error: ${e.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object)
        break
    }
  } catch (e) {
    console.error('[webhook handler]', e)
  }

  res.json({ received: true })
}
