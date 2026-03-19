export const MODELS = {
  'claude-haiku-4-5': {
    label: 'Haiku 4.5', provider: 'claude', type: 'text',
    credits: 1, description: 'Fast & efficient',
    plans: ['free', 'pro', 'ultra'], color: '#00FF41',
  },
  'claude-sonnet-4-6': {
    label: 'Sonnet 4.6', provider: 'claude', type: 'text',
    credits: 5, description: 'Smart & balanced',
    plans: ['pro', 'ultra'], color: '#00D4FF',
  },
  'claude-opus-4-6': {
    label: 'Opus 4.6', provider: 'claude', type: 'text',
    credits: 15, description: 'Most powerful',
    plans: ['ultra'], color: '#7B2FFF',
  },
  'gemini-2.5-flash': {
    label: 'Gemini Flash', provider: 'gemini', type: 'text',
    credits: 2, description: 'Google AI — fast',
    plans: ['pro', 'ultra'], color: '#FFB800',
  },
  'gemini-2.5-pro': {
    label: 'Gemini Pro', provider: 'gemini', type: 'text',
    credits: 8, description: 'Google AI — smart',
    plans: ['pro', 'ultra'], color: '#FFB800',
  },
  'imagen-4.0-fast-generate-001': {
    label: 'Imagen Fast', provider: 'gemini', type: 'image',
    credits: 6, description: 'Quick image gen',
    plans: ['free', 'pro', 'ultra'], color: '#FFB800',
  },
  'imagen-4.0-generate-001': {
    label: 'Imagen 4.0', provider: 'gemini', type: 'image',
    credits: 10, description: 'Standard quality',
    plans: ['pro', 'ultra'], color: '#FFB800',
  },
  'imagen-4.0-ultra-generate-001': {
    label: 'Imagen Ultra', provider: 'gemini', type: 'image',
    credits: 20, description: 'Best quality',
    plans: ['ultra'], color: '#FF2D55',
  },
}

export const PLAN_LIMITS = {
  free:  { chats: 5,    files: 1,  fileSize: 5  * 1024 * 1024, credits: 20  },
  pro:   { chats: null, files: 10, fileSize: 25 * 1024 * 1024, credits: 500 },
  ultra: { chats: null, files: 20, fileSize: 100* 1024 * 1024, credits: 1500},
}

export const CREDIT_PACKS = [
  { id: 'credits_100',  credits: 100,  price: 2.99,  label: '100 Credits' },
  { id: 'credits_500',  credits: 500,  price: 9.99,  label: '500 Credits',  badge: 'Popular' },
  { id: 'credits_1200', credits: 1200, price: 19.99, label: '1200 Credits', badge: 'Best Value' },
]

export const SUBSCRIPTIONS = [
  {
    id: 'sub_pro', label: 'Pro', price: 9.99, priceLabel: '$9.99/mo',
    color: '#00D4FF',
    perks: ['Unlimited chats', 'Projects', '500 credits/mo', 'Sonnet + Gemini models', 'Imagen Standard', '25MB file uploads'],
    models: ['claude-haiku-4-5','claude-sonnet-4-6','gemini-2.5-flash','gemini-2.5-pro','imagen-4.0-fast-generate-001','imagen-4.0-generate-001'],
  },
  {
    id: 'sub_ultra', label: 'Ultra', price: 19.99, priceLabel: '$19.99/mo',
    color: '#7B2FFF',
    perks: ['Everything in Pro', '1500 credits/mo', 'Opus 4.6', 'Imagen Ultra', '100MB file uploads'],
    models: Object.keys(MODELS),
  },
]

export function getCreditCost(model) {
  return MODELS[model]?.credits ?? 1
}

export function canUseModel(plan, model) {
  return MODELS[model]?.plans?.includes(plan) ?? false
}

export const IMAGE_MODELS = new Set([
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-generate-001',
  'imagen-4.0-ultra-generate-001',
])
