import test from 'node:test'
import assert from 'node:assert/strict'
import { createPayPalOrder, capturePayPalOrder } from './paypal.js'

test('createPayPalOrder returns structured order in simulation fallback', async () => {
    const order = await createPayPalOrder({
        amount: 2500,
        currency: 'USD',
        description: 'Test Procurement Order',
        referenceId: 'test-ref-123',
    })

    assert.ok(order.id, 'order should have an id')
    assert.equal(order.currency, 'USD')
    assert.equal(order.amount, '2500.00')
    assert.ok(order.status === 'CREATED' || order.status === 'COMPLETED' || order.status === 'APPROVED')
})

test('capturePayPalOrder completes simulated order successfully', async () => {
    const capture = await capturePayPalOrder('MOCK-ORDER-TEST')
    assert.ok(capture.id, 'capture should have an id')
    assert.equal(capture.status, 'COMPLETED')
})

