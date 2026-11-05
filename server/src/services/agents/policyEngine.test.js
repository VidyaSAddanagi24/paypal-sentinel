import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateAgreement } from './policyEngine.js'

const rules = { product: 'laptop', quantity: 10, maxBudget: 400000, currency: 'INR', maxDeliveryDays: 7 }
const good = { product: 'Laptops', quantity: 10, sellerId: 'seller-1', amount: 395000, currency: 'INR', deliveryDays: 5 }

test('valid agreement is allowed', () => {
    assert.equal(evaluateAgreement(rules, good).allowed, true)
})
test('amount above budget is blocked', () => {
    const r = evaluateAgreement(rules, { ...good, amount: 410000 })
    assert.equal(r.allowed, false)
    assert.ok(r.reasons[0].includes('exceeds the budget'))
})
test('amount exactly at budget is allowed', () => {
    assert.equal(evaluateAgreement(rules, { ...good, amount: 400000 }).allowed, true)
})
test('delivery too slow is blocked', () => {
    assert.equal(evaluateAgreement(rules, { ...good, deliveryDays: 12 }).allowed, false)
})
test('wrong currency is blocked', () => {
    assert.equal(evaluateAgreement(rules, { ...good, currency: 'USD' }).allowed, false)
})
test('wrong quantity is blocked', () => {
    assert.equal(evaluateAgreement(rules, { ...good, quantity: 8 }).allowed, false)
})
test('wrong product is blocked', () => {
    assert.equal(evaluateAgreement(rules, { ...good, product: 'phone' }).allowed, false)
})
test('missing seller is blocked', () => {
    assert.equal(evaluateAgreement(rules, { ...good, sellerId: '' }).allowed, false)
})
test('garbage amount (string, NaN, negative) is blocked', () => {
    for (const amount of ['cheap', NaN, -5, 0, undefined]) {
        assert.equal(evaluateAgreement(rules, { ...good, amount }).allowed, false)
    }
})
test('non-integer delivery days is blocked', () => {
    assert.equal(evaluateAgreement(rules, { ...good, deliveryDays: 'soon' }).allowed, false)
})