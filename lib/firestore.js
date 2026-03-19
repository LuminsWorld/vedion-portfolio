// Firestore REST API — pure fetch, no firebase-admin
import { getServiceAccountToken } from './googleAuth'

const PROJECT = 'vedion-978cc'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

// ─── Value encoding/decoding ───────────────────────────────────────────────

function enc(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'string') return { stringValue: v }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } }
  if (typeof v === 'object') return { mapValue: { fields: encFields(v) } }
  return { stringValue: String(v) }
}

function encFields(obj) {
  const f = {}
  for (const [k, val] of Object.entries(obj)) f[k] = enc(val)
  return f
}

function dec(v) {
  if ('nullValue' in v) return null
  if ('booleanValue' in v) return v.booleanValue
  if ('integerValue' in v) return parseInt(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('stringValue' in v) return v.stringValue
  if ('timestampValue' in v) return v.timestampValue
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(dec)
  if ('mapValue' in v) return decFields(v.mapValue.fields ?? {})
  return null
}

function decFields(fields) {
  const obj = {}
  for (const [k, v] of Object.entries(fields)) obj[k] = dec(v)
  return obj
}

function docId(name) { return name?.split('/').pop() }

// ─── CRUD helpers ───────────────────────────────────────────────────────────

async function auth() {
  return { Authorization: `Bearer ${await getServiceAccountToken()}` }
}

export async function getDoc(path) {
  const res = await fetch(`${BASE}/${path}`, { headers: await auth() })
  if (res.status === 404) return null
  const doc = await res.json()
  if (doc.error) return null
  return { id: docId(doc.name), ...decFields(doc.fields ?? {}) }
}

export async function setDoc(path, data) {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'PATCH',
    headers: { ...(await auth()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encFields(data) }),
  })
  return res.ok
}

export async function addDoc(collPath, data) {
  const res = await fetch(`${BASE}/${collPath}`, {
    method: 'POST',
    headers: { ...(await auth()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encFields(data) }),
  })
  const doc = await res.json()
  return docId(doc.name)
}

export async function updateDoc(path, data) {
  const fields = encFields(data)
  const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
  const res = await fetch(`${BASE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { ...(await auth()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  return res.ok
}

export async function deleteDoc(path) {
  const res = await fetch(`${BASE}/${path}`, { method: 'DELETE', headers: await auth() })
  return res.ok
}

export async function listDocs(collPath, { orderBy, desc: descOrder, limit } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('pageSize', String(limit))
  if (orderBy) params.set('orderBy', descOrder ? `${orderBy} desc` : orderBy)
  const res = await fetch(`${BASE}/${collPath}?${params}`, { headers: await auth() })
  const data = await res.json()
  if (!data.documents) return []
  return data.documents.map(doc => ({ id: docId(doc.name), ...decFields(doc.fields ?? {}) }))
}

export async function countDocs(collPath) {
  const parts = collPath.split('/')
  const collId = parts.pop()
  const parentPath = parts.join('/')
  const parent = `projects/${PROJECT}/databases/(default)/documents${parentPath ? '/' + parentPath : ''}`
  const res = await fetch(
    `https://firestore.googleapis.com/v1/${parent}:runAggregationQuery`,
    {
      method: 'POST',
      headers: { ...(await auth()), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredAggregationQuery: {
          aggregations: [{ alias: 'count', count: {} }],
          structuredQuery: { from: [{ collectionId: collId }] },
        },
      }),
    }
  )
  const rows = await res.json()
  return parseInt(rows?.[0]?.result?.aggregateFields?.count?.integerValue ?? '0')
}

export const serverTimestamp = () => new Date().toISOString()
export const generateId = () => crypto.randomUUID()
