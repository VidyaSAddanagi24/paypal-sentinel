import 'dotenv/config'

const base = `http://localhost:${process.env.PORT || 5000}/api`
const email = 'test@example.com'
const password = 'Test12345'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function call(method, path, body, token) {
    const res = await fetch(base + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    return { status: res.status, data }
}

let r = await call('POST', '/auth/login', { email, password })
if (r.status !== 200) r = await call('POST', '/auth/register', { name: 'Test User', email, password })
const token = r.data.token
if (!token) { console.log('Auth failed:', r.status, r.data); process.exit(1) }

const instructions = 'I want to purchase 10 laptops. Budget Rs 4,00,000. Delivery within 7 days.'
const rules = { product: 'laptop', quantity: 10, maxBudget: 400000, currency: 'INR', maxDeliveryDays: 7, requiresApproval: true }

r = await call('POST', '/negotiations', { instructions, rules }, token)
const id = r.data.negotiation?._id
console.log('negotiation id:', id)
console.log('create:', r.status, r.data.negotiation?.status, '(expect 201 DRAFT)')
console.log('no token:', (await call('GET', `/negotiations/${id}`)).status, '(expect 401)')
console.log('bad budget:', (await call('POST', '/negotiations', { instructions, rules: { ...rules, maxBudget: -5 } }, token)).status, '(expect 400)')

console.log('run:', (await call('POST', `/negotiations/${id}/run`, null, token)).status, '(expect 202)')
console.log('run again:', (await call('POST', `/negotiations/${id}/run`, null, token)).status, '(expect 409)')

let s
for (let i = 0; i < 40; i++) {
    await sleep(5000)
    s = (await call('GET', `/negotiations/${id}`, null, token)).data
    console.log(`${s.negotiation.status} rounds=${s.negotiation.roundsUsed} messages=${s.messages.length}`)
    if (s.negotiation.status !== 'NEGOTIATING') break
}

for (const m of s.messages) console.log(`R${m.round} ${m.role}: ${m.offer?.amount ?? '-'} | ${m.text}`)
console.log('policy allowed:', s.agreement?.validation?.allowed)
console.log('events:', s.events.map((e) => e.type).join(', '))
console.log('seller floor hidden:', s.negotiation.sellerProfile?.minPrice === undefined)
for (const e of s.events.filter((e) => e.type === 'NEGOTIATION_ERROR')) console.log('error:', e.details?.message)

if (s.negotiation.status === 'AWAITING_APPROVAL') {
    const a = await call('POST', `/negotiations/${id}/approve`, null, token)
    console.log('approve:', a.status, a.data.snapshotHash?.slice(0, 16), a.data.expiresAt, '(expect 200)')
    console.log('approve again:', (await call('POST', `/negotiations/${id}/approve`, null, token)).status, '(expect 409)')
}