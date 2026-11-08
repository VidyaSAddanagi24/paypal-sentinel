const BASE_URL = import.meta.env.VITE_API_URL || ''

export function getToken() {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  } catch {
    // ignore storage access errors
  }
}

export function clearToken() {
  try {
    localStorage.removeItem('token')
  } catch {
    // ignore storage access errors
  }
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  try {
    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  } catch {
    // ignore storage access errors
  }

  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`)
  }

  return data
}

export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),
  put: (path, body, options) =>
    apiFetch(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
}

export default api

