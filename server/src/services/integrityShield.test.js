import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyBeforeCapture } from './integrityShield.js'
import { hashTerms } from './snapshot.js'

const terms = { product: 'laptop', quantity: 10, sellerId: 'sim-seller-001', sellerName: 'Simulated Seller Co.', amount: 395000, currency: 'INR', deliveryDays: 5 }
const hash = hashTerms(terms)
const make = () => ({
    agreement: { _id: 'a1', status: 'APPROVED', terms: { ...terms }, snapshot: { terms: { ...terms }, hash } },
    authorization: { agreementId: 'a1', snapshotHash: hash, status: 'ACTIVE', consumedAt: null, expiresAt: new Date(Date.now() + 600000) },
    order: { purchase_units: [{ reference_id: 'sim-seller-001', custom_id: 'a1', amount: { currency_code: 'INR', value: '395000.00' } }] },
})
const failed = (r) => r.checks.filter((c) => !c.passed).map((c) => c.rule)

test('clean transaction passes every check', () => {
    assert.equal(verifyBeforeCapture(make()).ok, true)
})
test('changed order amount is blocked', () => {
    const x = make(); x.order.purchase_units[0].amount.value = '410000.00'
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['order_amount'])
})
test('changed order currency is blocked', () => {
    const x = make(); x.order.purchase_units[0].amount.currency_code = 'USD'
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['order_currency'])
})
test('changed merchant is blocked', () => {
    const x = make(); x.order.purchase_units[0].reference_id = 'evil-seller'
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['order_merchant'])
})
test('order for a different agreement is blocked', () => {
    const x = make(); x.order.purchase_units[0].custom_id = 'a2'
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['order_agreement'])
})
test('expired authorization is blocked', () => {
    const x = make(); x.authorization.expiresAt = new Date(Date.now() - 1000)
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['authorization_not_expired'])
})
test('reused authorization is blocked', () => {
    const x = make(); x.authorization.consumedAt = new Date()
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['authorization_unused'])
})
test('terms edited after approval are blocked', () => {
    const x = make(); x.agreement.terms.amount = 400000
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['terms_unchanged'])
})
test('tampered snapshot is blocked', () => {
    const x = make(); x.agreement.snapshot.terms.amount = 1
    assert.ok(failed(verifyBeforeCapture(x)).includes('snapshot_intact'))
})
test('authorization for another snapshot is blocked', () => {
    const x = make(); x.authorization.snapshotHash = 'deadbeef'
    assert.deepEqual(failed(verifyBeforeCapture(x)), ['authorization_matches'])
})