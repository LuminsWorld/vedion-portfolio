import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'
import { PLAN_LIMITS } from './credits'

export const ALLOWED_TYPES = {
  // Images
  'image/jpeg': true, 'image/png': true, 'image/gif': true, 'image/webp': true,
  // Documents
  'application/pdf': true,
  // Text / code
  'text/plain': true, 'text/markdown': true, 'text/csv': true,
  'text/javascript': true, 'text/typescript': true, 'text/html': true,
  'text/css': true, 'application/json': true, 'application/xml': true,
}

export const TYPE_LABELS = {
  'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/gif': 'GIF', 'image/webp': 'WEBP',
  'application/pdf': 'PDF',
  'text/plain': 'TXT', 'text/markdown': 'MD', 'text/csv': 'CSV',
  'text/javascript': 'JS', 'text/typescript': 'TS', 'text/html': 'HTML',
  'text/css': 'CSS', 'application/json': 'JSON', 'application/xml': 'XML',
}

export function validateFiles(files, plan) {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const errors = []

  if (files.length > limits.files) {
    errors.push(`Max ${limits.files} file${limits.files > 1 ? 's' : ''} per message on ${plan} plan.`)
  }

  for (const file of files) {
    if (!ALLOWED_TYPES[file.type]) {
      errors.push(`${file.name}: unsupported file type (${file.type || 'unknown'}).`)
    }
    if (file.size > limits.fileSize) {
      const mb = Math.round(limits.fileSize / 1024 / 1024)
      errors.push(`${file.name}: exceeds ${mb}MB limit on ${plan} plan.`)
    }
  }

  return errors
}

export async function uploadFile(file, uid, chatId, onProgress) {
  const ext  = file.name.split('.').pop()
  const path = `uploads/${uid}/${chatId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type })

    task.on(
      'state_changed',
      snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(storageRef)
        resolve({ name: file.name, url, mimeType: file.type, size: file.size, path })
      }
    )
  })
}

export async function deleteFile(path) {
  try {
    await deleteObject(ref(storage, path))
  } catch (_) {}
}
