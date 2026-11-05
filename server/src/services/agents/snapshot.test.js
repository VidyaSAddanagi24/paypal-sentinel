import test from 'node:test'
import assert from 'node:assert/strict'
import { hashTerms } from './snapshot.js'

const t = { product: 'laptop', quantity: 10, sellerId: 's1', sellerName: 'Demo', amount: 395000, currency: 'INR', deliveryDays: 5 }

test('same terms give the same hash', () => {
    assert.equal(hashTerms(t), hashTerms({ ...t }))
})
test('changed amount, currency or seller changes the hash', () => {
    const base = hashTerms(t)
    assert.notEqual(hashTerms({ ...t, amount: 395001 }), base)
    assert.notEqual(hashTerms({ ...t, currency: 'USD' }), base)
    assert.notEqual(hashTerms({ ...t, sellerId: 's2' }), base)
})