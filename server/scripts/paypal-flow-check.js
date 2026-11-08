import 'dotenv/config'

const base = `http://localhost:${process.env.PORT || 5000}/api`
const [id, step] = process.argv.slice(2)
if (!id || !['order', 'capture'].includes(step)) {
    console.log('Usage: node scripts\\paypal-flow-check.js <negotiationId> order|capture')
    process.exit(1)
}

async function call(method, path, body, token) {
    const res = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    })
    return { status: res.status, data: await res.json().catch(() => ({})) }
}

const login = await call('POST', '/auth/login', { email: 'test@example.com', password: 'Test12345' })
if (!login.data.token) { console.log('Login failed:', login.status, login.data); process.exit(1) }

const r = await call('POST', `/payments/${id}/${step}`, null, login.data.token)
console.log(r.status, JSON.stringify(r.data, null, 2))
if (step === 'order' && r.data.approveUrl) {
    console.log('\nOpen this URL, log in with your Sandbox PERSONAL (buyer) account and approve the payment:\n' + r.data.approveUrl)
}