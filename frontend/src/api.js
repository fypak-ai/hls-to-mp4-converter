const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function startConvert({ url, filename }) {
  const res = await fetch(`${BASE}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url || null, filename: filename || null }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function pollJob(jobId) {
  const res = await fetch(`${BASE}/jobs/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function listJobs() {
  const res = await fetch(`${BASE}/jobs`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteJob(jobId) {
  const res = await fetch(`${BASE}/jobs/${jobId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function mediaUrl(path) {
  return `${BASE}${path}`
}
