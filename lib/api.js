import { auth } from './firebase'

async function getToken() {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

async function request(path, options = {}) {
  const token = await getToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  let data
  try { data = await res.json() } catch { data = { error: `HTTP ${res.status} — non-JSON response` } }
  if (!res.ok) throw { ...data, _status: res.status, _path: path }
  return data
}

export const getMe         = ()              => request('/api/user/me')
export const checkout      = (itemId)        => request('/api/stripe/checkout', { method: 'POST', body: JSON.stringify({ itemId }) })
export const listChats     = ()              => request('/api/chats')
export const createChat    = (title, pid)    => request('/api/chats', { method: 'POST', body: JSON.stringify({ title, projectId: pid }) })
export const deleteChat    = (id)            => request(`/api/chats/${id}`, { method: 'DELETE' })
export const renameChat    = (id, title)     => request(`/api/chats/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) })
export const getMessages   = (id)            => request(`/api/chats/${id}`)
export const sendMessage   = (chatId, msg, model, history, files = []) =>
  request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ chatId, message: msg, model, history, files }) })
export const generateImage = (chatId, prompt, model, aspectRatio) =>
  request('/api/ai/image', { method: 'POST', body: JSON.stringify({ chatId, prompt, model, aspectRatio }) })
