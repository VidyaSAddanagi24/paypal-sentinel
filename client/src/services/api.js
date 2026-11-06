const TOKEN_KEY = 'paypal_sentinel_token'
const USER_KEY = 'paypal_sentinel_user'

export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

export function getStoredUser() {
    try {
        const raw = localStorage.getItem(USER_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

async function request(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    }

    const token = getToken()
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(path, { ...options, headers })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`)
    }

    return data
}

// Authentication
export async function login(email, password) {
    const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })
    setSession(data.token, data.user)
    return data
}

export async function register(name, email, password) {
    const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    })
    setSession(data.token, data.user)
    return data
}

export async function getMe() {
    return request('/api/auth/me')
}

// Negotiations
export async function parseInstructions(instructions) {
    return request('/api/negotiations/parse', {
        method: 'POST',
        body: JSON.stringify({ instructions }),
    })
}

export async function createNegotiation(instructions, rules) {
    return request('/api/negotiations', {
        method: 'POST',
        body: JSON.stringify({ instructions, rules }),
    })
}

export async function listNegotiations() {
    return request('/api/negotiations')
}

export async function listAuditEvents() {
    return request('/api/negotiations/audit/all')
}

export async function getNegotiation(id) {
    return request(`/api/negotiations/${id}`)
}

export async function runNegotiation(id) {
    return request(`/api/negotiations/${id}/run`, {
        method: 'POST',
    })
}

export async function approveNegotiation(id) {
    return request(`/api/negotiations/${id}/approve`, {
        method: 'POST',
    })
}

export async function createPayPalOrder(id) {
    return request(`/api/negotiations/${id}/paypal/create-order`, {
        method: 'POST',
    })
}

export async function capturePayPalOrder(id) {
    return request(`/api/negotiations/${id}/paypal/capture-order`, {
        method: 'POST',
    })
}

export async function simulateDrift(id) {
    return request(`/api/negotiations/${id}/simulate-drift`, {
        method: 'POST',
    })
}
