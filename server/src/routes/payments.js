import { Router } from 'express'
import mongoose from 'mongoose'
import Negotiation from '../models/Negotiation.js'
import Agreement from '../models/Agreement.js'
import Authorization from '../models/Authorization.js'
import { requireAuth } from '../middleware/auth.js'
import { hashTerms } from '../services/snapshot.js'
import { verifyBeforeCapture } from '../services/integrityShield.js'
import { createPayPalOrder, getPayPalOrder, capturePayPalOrder, PayPalError } from '../services/paypal.js'
import { logEvent } from '../services/audit.js'

const router = Router()
router.use(requireAuth)

const approveLink = (order) =>
    (order.links?.find((l) => l.rel === 'payer-action') || order.links?.find((l) => l.rel === 'approve'))?.href || null

// Loads the negotiation, its agreement and the latest authorization, only if they belong to this user.
async function loadDeal(req) {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) return null
    const negotiation = await Negotiation.findOne({ _id: id, userId: req.user._id })
    if (!negotiation || !negotiation.agreementId) return null
    const agreement = await Agreement.findOne({ _id: negotiation.agreementId, userId: req.user._id })
    if (!agreement) return null
    const authorization = await Authorization.findOne({ agreementId: agreement._id, userId: req.user._id }).sort({ createdAt: -1 })
    return { negotiation, agreement, authorization }
}

// Kills the authorization, marks the negotiation and records the block in the audit trail.
async function blockPayment({ negotiation, authorization, userId, status, reasons, checks, orderId }) {
    const expired = status === 'EXPIRED'
    await Authorization.updateOne({ _id: authorization._id, status: 'ACTIVE' }, { status: expired ? 'EXPIRED' : 'REVOKED' })
    await Negotiation.updateOne({ _id: negotiation._id, status: { $ne: 'CAPTURED' } }, { status })
    await logEvent({
        negotiationId: negotiation._id, userId,
        type: expired ? 'AUTHORIZATION_EXPIRED' : 'DRIFT_BLOCKED',
        details: { reasons, checks, orderId },
    })
}

async function paypalFail(err, { res, next, base, type }) {
    if (!(err instanceof PayPalError)) return next(err)
    await logEvent({
        ...base, type,
        details: { status: err.status, message: err.message, debugId: err.details?.debug_id },
    }).catch(() => { })
    res.status(502).json({ error: `PayPal error: ${err.message}` })
}

// Create the PayPal order from the approved snapshot. Returns the URL where the buyer approves in PayPal.
router.post('/:id/order', async (req, res, next) => {
    let base
    try {
        const deal = await loadDeal(req)
        if (!deal) return res.status(404).json({ error: 'Not found' })
        const { negotiation, agreement, authorization } = deal
        base = { negotiationId: negotiation._id, userId: req.user._id }

        if (!['APPROVED', 'PAYPAL_ORDER_CREATED'].includes(negotiation.status) ||
            agreement.status !== 'APPROVED' || !agreement.snapshot?.terms || !authorization) {
            return res.status(409).json({ error: 'Approve the agreement before paying' })
        }
        if (authorization.status !== 'ACTIVE' || authorization.consumedAt) {
            return res.status(409).json({ error: 'This authorization is no longer valid. Approval must be repeated.' })
        }
        if (new Date(authorization.expiresAt) <= new Date()) {
            await blockPayment({
                negotiation, authorization, userId: req.user._id, status: 'EXPIRED',
                reasons: ['Authorization expired before the PayPal order was created']
            })
            return res.status(409).json({ error: 'The approval expired. Approval must be repeated.' })
        }
        const snap = agreement.snapshot
        if (hashTerms(snap.terms) !== snap.hash || hashTerms(agreement.terms) !== snap.hash) {
            await blockPayment({
                negotiation, authorization, userId: req.user._id, status: 'BLOCKED_DRIFT',
                reasons: ['Agreement terms differ from the approved snapshot']
            })
            return res.status(409).json({ error: 'Payment blocked: the agreement changed after approval.' })
        }

        // Order already created for this authorization: return it instead of creating a second one.
        if (authorization.paypalOrderId) {
            const existing = await getPayPalOrder(authorization.paypalOrderId)
            return res.json({ orderId: existing.id, status: existing.status, approveUrl: approveLink(existing) })
        }

        const terms = snap.terms.toObject()
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
        const order = await createPayPalOrder({
            agreementId: agreement._id,
            terms,
            returnUrl: `${clientUrl}/deal/${negotiation._id}?paypal=return`,
            cancelUrl: `${clientUrl}/deal/${negotiation._id}?paypal=cancel`,
            requestId: `order-${authorization._id}`,
        })
        await Authorization.updateOne({ _id: authorization._id, paypalOrderId: null }, { paypalOrderId: order.id })
        await Negotiation.updateOne({ _id: negotiation._id }, { status: 'PAYPAL_ORDER_CREATED' })
        await logEvent({
            ...base, type: 'PAYPAL_ORDER_CREATED',
            details: { orderId: order.id, amount: terms.amount, currency: terms.currency, merchant: terms.sellerId },
        })
        res.status(201).json({ orderId: order.id, status: order.status, approveUrl: order.approveUrl })
    } catch (err) {
        await paypalFail(err, { res, next, base, type: 'PAYPAL_ORDER_FAILED' })
    }
})

// Capture. Only this endpoint can move money, and only after the Integrity Shield passes.
router.post('/:id/capture', async (req, res, next) => {
    let base
    try {
        const deal = await loadDeal(req)
        if (!deal) return res.status(404).json({ error: 'Not found' })
        const { negotiation, agreement, authorization } = deal
        base = { negotiationId: negotiation._id, userId: req.user._id }

        if (negotiation.status !== 'PAYPAL_ORDER_CREATED' || !authorization?.paypalOrderId) {
            return res.status(409).json({ error: 'Create the PayPal order first, or this payment was already completed' })
        }

        // Always ask PayPal for the real order. Never trust anything the browser says about it.
        const order = await getPayPalOrder(authorization.paypalOrderId)
        if (order.status !== 'APPROVED') {
            return res.status(409).json({ error: `Complete the PayPal checkout first (order status: ${order.status})` })
        }

        // Integrity Shield: approved snapshot vs authorization vs the actual PayPal order.
        const verdict = verifyBeforeCapture({ agreement, authorization, order })
        if (!verdict.ok) {
            const onlyExpired = verdict.checks.filter((c) => !c.passed).every((c) => c.rule === 'authorization_not_expired')
            await blockPayment({
                negotiation, authorization, userId: req.user._id,
                status: onlyExpired ? 'EXPIRED' : 'BLOCKED_DRIFT',
                reasons: verdict.reasons, checks: verdict.checks, orderId: authorization.paypalOrderId,
            })
            return res.status(409).json({ blocked: true, error: 'Payment blocked by the Integrity Shield', reasons: verdict.reasons })
        }

        // Single use: only one request can consume the authorization.
        const claimed = await Authorization.findOneAndUpdate(
            { _id: authorization._id, status: 'ACTIVE', consumedAt: null },
            { status: 'CONSUMED', consumedAt: new Date() },
            { new: true }
        )
        if (!claimed) {
            await logEvent({ ...base, type: 'DUPLICATE_CAPTURE_BLOCKED', details: { orderId: authorization.paypalOrderId } })
            return res.status(409).json({ error: 'This authorization has already been used' })
        }

        let capture
        try {
            capture = await capturePayPalOrder(authorization.paypalOrderId, `capture-${authorization._id}`)
        } catch (err) {
            // The authorization is spent, so a retry cannot double-charge. A fresh approval is needed.
            await Authorization.updateOne({ _id: authorization._id }, { status: 'REVOKED' })
            return paypalFail(err, { res, next, base, type: 'PAYPAL_CAPTURE_FAILED' })
        }

        const completed = capture.captureStatus === 'COMPLETED'
        await Authorization.updateOne({ _id: authorization._id }, { paypalCaptureId: capture.captureId })
        if (completed) await Negotiation.updateOne({ _id: negotiation._id }, { status: 'CAPTURED' })
        await logEvent({
            ...base, type: completed ? 'PAYMENT_CAPTURED' : 'PAYMENT_NOT_COMPLETED',
            details: {
                orderId: authorization.paypalOrderId, captureId: capture.captureId,
                orderStatus: capture.status, captureStatus: capture.captureStatus,
            },
        })
        res.json({ captured: completed, orderId: authorization.paypalOrderId, captureId: capture.captureId, paymentStatus: capture.captureStatus })
    } catch (err) {
        await paypalFail(err, { res, next, base, type: 'PAYPAL_CAPTURE_FAILED' })
    }
})

export default router