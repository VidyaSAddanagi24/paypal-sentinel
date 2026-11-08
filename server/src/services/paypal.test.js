import test from 'node:test'
import assert from 'node:assert/strict'
import { createPayPalOrder, capturePayPalOrder, PayPalError } from './paypal.js'

process.env.PAYPAL_CLIENT_ID = 'test-id'
process.env.PAYPAL_CLIENT_SECRET = 'test-secret'
process.env.PAYPAL_BASE_URL = 'https://paypal.test'

const terms = { product: 'laptop', quantity: 10, sellerId: 'sim-seller-001', sellerName: 'Simulated Seller Co.', amount: 395000, currency: 'INR', deliveryDays: 5 }
const json = (status, body) => ({ ok: status < 400, status, json: async () => body })
const isToken = (url) => url.endsWith('/v1/oauth2/token')

function mockFetch(handler) {
    const calls = []
    globalThis.fetch = async (url, opts = {}) => { calls.push({ url, opts }); return handler(url, opts) }
    return calls
}

test('createPayPalOrder sends the approved terms and returns the approval link', async () => {
    const calls = mockFetch((url) => isToken(url)
        ? json(200, { access_token: 't', expires_in: 3600 })
        : json(201, { id: 'ORDER1', status: 'PAYER_ACTION_REQUIRED', links: [{ rel: 'payer-action', href: 'https://paypal.test/approve/ORDER1' }] }))
    const o = await createPayPalOrder({ agreementId: 'a1', terms, returnUrl: 'http://x/r', cancelUrl: 'http://x/c', requestId: 'req-1' })
    assert.equal(o.id, 'ORDER1')
    assert.equal(o.approveUrl, 'https://paypal.test/approve/ORDER1')
    const call = calls.find((c) => c.url.endsWith('/v2/checkout/orders'))
    const unit = JSON.parse(call.opts.body).purchase_units[0]
    assert.equal(unit.amount.value, '395000.00')
    assert.equal(unit.amount.currency_code, 'INR')
    assert.equal(unit.reference_id, 'sim-seller-001')
    assert.equal(unit.custom_id, 'a1')
    assert.equal(call.opts.headers['PayPal-Request-Id'], 'req-1')
})

test('a PayPal error is thrown, never turned into a fake success', async () => {
    mockFetch((url) => isToken(url)
        ? json(200, { access_token: 't', expires_in: 3600 })
        : json(422, { name: 'UNPROCESSABLE_ENTITY', message: 'bad', details: [{ issue: 'CURRENCY_NOT_SUPPORTED' }] }))
    await assert.rejects(
        () => createPayPalOrder({ agreementId: 'a1', terms, returnUrl: 'x', cancelUrl: 'y', requestId: 'r' }),
        (e) => e instanceof PayPalError && e.status === 422 && e.message === 'CURRENCY_NOT_SUPPORTED'
    )
})

test('capturePayPalOrder returns the real capture reference', async () => {
    mockFetch((url) => isToken(url)
        ? json(200, { access_token: 't', expires_in: 3600 })
        : json(201, { id: 'ORDER1', status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'CAP1', status: 'COMPLETED' }] } }] }))
    const c = await capturePayPalOrder('ORDER1', 'req-2')
    assert.equal(c.captureId, 'CAP1')
    assert.equal(c.status, 'COMPLETED')
})