import 'dotenv/config'

const base = `http://localhost:${process.env.PORT || 5000}/api`
const id = process.argv[2]
const login = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'Test12345' }),
}).then((r) => r.json())

const res = await fetch(`${base}/negotiations/${id}`, { headers: { Authorization: `Bearer ${login.token}` } })
const d = await res.json()
console.log('GET status:', res.status)
if (d.negotiation) {
    console.log('negotiation:', d.negotiation.status, '| agreementId:', d.negotiation.agreementId ?? 'none')
    console.log('agreement:', d.agreement?.status ?? 'none')
    console.log('events:', d.events.map((e) => e.type).join(', '))
    for (const e of d.events.filter((e) => e.type === 'NEGOTIATION_ERROR')) console.log('error:', e.details?.message)
}