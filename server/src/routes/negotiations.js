import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import Negotiation from '../models/Negotiation.js'
import Message from '../models/Message.js'
import Agreement from '../models/Agreement.js'
import AuditEvent from '../models/AuditEvent.js'
import Authorization from '../models/Authorization.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { rulesSchema } from '../services/agents/schemas.js'
import { parseInstructions } from '../services/agents/buyerAgent.js'
import { runNegotiation, defaultSellerProfile } from '../services/agents/negotiator.js'
import { evaluateAgreement } from '../services/policyEngine.js'
import { pickTerms, hashTerms } from '../services/snapshot.js'
import { logEvent } from '../services/audit.js'
import { createPayPalOrder, capturePayPalOrder } from '../services/paypal.js'

const router = Router()
router.use(requireAuth)

const instructionsSchema = z.string().trim().min(10).max(2000)
const parseSchema = z.object({ instructions: instructionsSchema })
const createSchema = z.object({ instructions: instructionsSchema, rules: rulesSchema })

// The seller's private price floor is never sent to the browser.
function publicNegotiation(n) {
    const o = n.toObject ? n.toObject() : { ...n }
    if (o.sellerProfile) delete o.sellerProfile.minPrice
    return o
}

// Loads a negotiation only if it belongs to the logged-in user.
async function loadOwned(req, res, next) {
    try {
        const { id } = req.params
        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Not found' })
        const n = await Negotiation.findOne({ _id: id, userId: req.user._id })
        if (!n) return res.status(404).json({ error: 'Not found' })
        req.negotiation = n
        next()
    } catch (err) {
        next(err)
    }
}

// 1. Free text -> draft rules. The human reviews and edits them before anything starts.
router.post('/parse', validate(parseSchema), async (req, res, next) => {
    try {
        const draft = await parseInstructions(req.body.instructions)
        res.json({ draft })
    } catch {
        next(Object.assign(new Error('The AI service is busy. Please try again in a moment.'), { status: 503 }))
    }
})

// 2. Create a negotiation from the human-confirmed rules. The seller profile is server-generated.
router.post('/', validate(createSchema), async (req, res, next) => {
    try {
        const { instructions, rules } = req.body
        const n = await Negotiation.create({
            userId: req.user._id,
            instructions,
            rules,
            sellerProfile: defaultSellerProfile(rules),
        })
        await logEvent({
            negotiationId: n._id, userId: req.user._id, type: 'NEGOTIATION_CREATED',
            details: { instructions, rules, sellerSimulated: true },
        })
        res.status(201).json({ negotiation: publicNegotiation(n) })
    } catch (err) {
        next(err)
    }
})

// 3. List my negotiations.
router.get('/', async (req, res, next) => {
    try {
        const items = await Negotiation.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(50)
        res.json({ negotiations: items.map(publicNegotiation) })
    } catch (err) {
        next(err)
    }
})

// 3b. List user's global audit trail.
router.get('/audit/all', async (req, res, next) => {
    try {
        const events = await AuditEvent.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100)
        res.json({ events })
    } catch (err) {
        next(err)
    }
})

// 4. One negotiation with its transcript, agreement, audit events, and authorization. The frontend polls this.
router.get('/:id', loadOwned, async (req, res, next) => {
    try {
        const n = req.negotiation
        const [messages, agreement, events, authorization] = await Promise.all([
            Message.find({ negotiationId: n._id }).sort({ createdAt: 1 }),
            n.agreementId ? Agreement.findById(n.agreementId) : null,
            AuditEvent.find({ negotiationId: n._id }).sort({ createdAt: 1 }),
            n.agreementId ? Authorization.findOne({ agreementId: n.agreementId }).sort({ createdAt: -1 }) : null,
        ])
        res.json({ negotiation: publicNegotiation(n), messages, agreement, events, authorization })
    } catch (err) {
        next(err)
    }
})

// 5. Start the negotiation. Returns immediately; the agents run in the background.
router.post('/:id/run', loadOwned, async (req, res, next) => {
    try {
        // Atomic claim: only a DRAFT can start, so a double click can't start it twice.
        const claimed = await Negotiation.findOneAndUpdate(
            { _id: req.negotiation._id, userId: req.user._id, status: 'DRAFT' },
            { status: 'NEGOTIATING', roundsUsed: 0 },
            { new: true }
        )
        if (!claimed) return res.status(409).json({ error: 'This negotiation has already started' })
        await logEvent({ negotiationId: claimed._id, userId: req.user._id, type: 'NEGOTIATION_STARTED' })
        res.status(202).json({ status: 'NEGOTIATING' })
        execute(claimed).catch((err) => console.error('negotiation crashed:', err))
    } catch (err) {
        next(err)
    }
})

// 6. Approve the agreement. The human signs off, creating an immutable cryptographic snapshot and authorization token.
router.post('/:id/approve', loadOwned, async (req, res, next) => {
    try {
        const n = req.negotiation
        if (n.status !== 'AWAITING_APPROVAL') {
            return res.status(400).json({ error: `Cannot approve negotiation with status '${n.status}'. Expected 'AWAITING_APPROVAL'.` })
        }
        const agreement = await Agreement.findOne({ _id: n.agreementId, userId: req.user._id })
        if (!agreement) {
            return res.status(404).json({ error: 'Agreement not found' })
        }
        if (!agreement.validation?.allowed) {
            return res.status(400).json({ error: 'Cannot approve an agreement that failed policy compliance checks' })
        }

        const canonicalTerms = pickTerms(agreement.terms)
        const hash = hashTerms(canonicalTerms)
        const now = new Date()

        // Seal snapshot into agreement
        agreement.snapshot = {
            terms: canonicalTerms,
            hash,
            approvedAt: now,
        }
        agreement.status = 'APPROVED'
        await agreement.save()

        // Create time-bounded cryptographic authorization (15 minutes)
        const authorization = await Authorization.create({
            agreementId: agreement._id,
            userId: req.user._id,
            snapshotHash: hash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            status: 'ACTIVE',
        })

        await Negotiation.updateOne({ _id: n._id }, { status: 'APPROVED' })
        n.status = 'APPROVED'

        await logEvent({
            negotiationId: n._id,
            userId: req.user._id,
            type: 'AGREEMENT_APPROVED',
            details: {
                terms: canonicalTerms,
                snapshotHash: hash,
                authorizationId: authorization._id,
                expiresAt: authorization.expiresAt,
            },
        })

        res.json({
            negotiation: publicNegotiation(n),
            agreement,
            authorization,
        })
    } catch (err) {
        next(err)
    }
})

// 7. Create PayPal Order guarded by cryptographic term-drift validation.
router.post('/:id/paypal/create-order', loadOwned, async (req, res, next) => {
    try {
        const n = req.negotiation
        if (!['APPROVED', 'PAYPAL_ORDER_CREATED'].includes(n.status)) {
            return res.status(400).json({ error: `Invalid status '${n.status}' for PayPal checkout` })
        }
        const agreement = await Agreement.findOne({ _id: n.agreementId, userId: req.user._id })
        if (!agreement) return res.status(404).json({ error: 'Agreement not found' })

        const auth = await Authorization.findOne({ agreementId: agreement._id, userId: req.user._id, status: 'ACTIVE' }).sort({ createdAt: -1 })
        if (!auth) {
            return res.status(403).json({ error: 'No active authorization found. Please approve the agreement first.' })
        }
        if (new Date() > new Date(auth.expiresAt)) {
            auth.status = 'EXPIRED'
            await auth.save()
            await Negotiation.updateOne({ _id: n._id }, { status: 'EXPIRED' })
            await logEvent({ negotiationId: n._id, userId: req.user._id, type: 'AUTHORIZATION_EXPIRED', details: { authorizationId: auth._id } })
            return res.status(403).json({ error: 'Authorization token has expired. Re-approval required.' })
        }

        // CRITICAL SECURITY CHECK: Sentinel Drift Gate
        const currentTerms = pickTerms(agreement.terms)
        const currentHash = hashTerms(currentTerms)
        if (currentHash !== auth.snapshotHash) {
            await Negotiation.updateOne({ _id: n._id }, { status: 'BLOCKED_DRIFT' })
            await logEvent({
                negotiationId: n._id,
                userId: req.user._id,
                type: 'BLOCKED_DRIFT',
                details: {
                    expectedHash: auth.snapshotHash,
                    actualHash: currentHash,
                    currentTerms,
                },
            })
            return res.status(403).json({
                error: 'SENTINEL_BLOCKED_DRIFT: Terms have drifted or been tampered with after human authorization! PayPal payment aborted.',
            })
        }

        const order = await createPayPalOrder({
            amount: agreement.terms.amount,
            currency: agreement.terms.currency || 'USD',
            description: `PayPal Sentinel: ${agreement.terms.quantity}x ${agreement.terms.product}`,
            referenceId: n._id.toString(),
        })

        auth.paypalOrderId = order.id
        await auth.save()

        await Negotiation.updateOne({ _id: n._id }, { status: 'PAYPAL_ORDER_CREATED' })
        n.status = 'PAYPAL_ORDER_CREATED'

        await logEvent({
            negotiationId: n._id,
            userId: req.user._id,
            type: 'PAYPAL_ORDER_CREATED',
            details: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                simulated: order.simulated,
            },
        })

        res.json({ order, authorization: auth, negotiation: publicNegotiation(n) })
    } catch (err) {
        next(err)
    }
})

// 8. Capture PayPal payment and consume authorization.
router.post('/:id/paypal/capture-order', loadOwned, async (req, res, next) => {
    try {
        const n = req.negotiation
        const agreement = await Agreement.findOne({ _id: n.agreementId, userId: req.user._id })
        if (!agreement) return res.status(404).json({ error: 'Agreement not found' })

        const auth = await Authorization.findOne({ agreementId: agreement._id, userId: req.user._id, status: 'ACTIVE' }).sort({ createdAt: -1 })
        if (!auth || !auth.paypalOrderId) {
            return res.status(400).json({ error: 'No active PayPal order ready for capture.' })
        }

        // Final drift verification
        const currentTerms = pickTerms(agreement.terms)
        const currentHash = hashTerms(currentTerms)
        if (currentHash !== auth.snapshotHash) {
            await Negotiation.updateOne({ _id: n._id }, { status: 'BLOCKED_DRIFT' })
            await logEvent({
                negotiationId: n._id,
                userId: req.user._id,
                type: 'BLOCKED_DRIFT',
                details: { expectedHash: auth.snapshotHash, actualHash: currentHash },
            })
            return res.status(403).json({ error: 'SENTINEL_BLOCKED_DRIFT: Drift detected before capture.' })
        }

        const capture = await capturePayPalOrder(auth.paypalOrderId)

        auth.status = 'CONSUMED'
        auth.consumedAt = new Date()
        await auth.save()

        await Negotiation.updateOne({ _id: n._id }, { status: 'CAPTURED' })
        n.status = 'CAPTURED'

        await logEvent({
            negotiationId: n._id,
            userId: req.user._id,
            type: 'PAYPAL_CAPTURED',
            details: {
                captureId: capture.id,
                status: capture.status,
                orderId: auth.paypalOrderId,
                simulated: capture.simulated,
            },
        })

        res.json({ capture, negotiation: publicNegotiation(n), authorization: auth })
    } catch (err) {
        next(err)
    }
})

// 9. Demo security defense: intentionally tamper with agreed terms to prove Sentinel catches drift.
router.post('/:id/simulate-drift', loadOwned, async (req, res, next) => {
    try {
        const n = req.negotiation
        const agreement = await Agreement.findOne({ _id: n.agreementId, userId: req.user._id })
        if (!agreement) return res.status(404).json({ error: 'Agreement not found' })

        // Artificially inflate the price by 15% as an unauthorized seller drift / injection attack
        const originalAmount = agreement.terms.amount
        agreement.terms.amount = Math.round(originalAmount * 1.15)
        await agreement.save()

        await logEvent({
            negotiationId: n._id,
            userId: req.user._id,
            type: 'DRIFT_INJECTION_SIMULATED',
            details: {
                originalAmount,
                tamperedAmount: agreement.terms.amount,
                note: 'Tampered price outside authorization to test Sentinel SHA-256 detection',
            },
        })

        res.json({
            message: `Drift injected: price altered from ${originalAmount} to ${agreement.terms.amount}. Initiating PayPal checkout will now trigger Sentinel drift blocking.`,
            agreement,
        })
    } catch (err) {
        next(err)
    }
})

async function execute(n) {
    const { rules, sellerProfile, maxRounds } = n.toObject ? n.toObject() : n
    const base = { negotiationId: n._id, userId: n.userId }
    try {
        const result = await runNegotiation({
            rules, sellerProfile, maxRounds,
            onMessage: async (m) => {
                await Message.create({
                    negotiationId: n._id, round: m.round, role: m.role, text: m.text,
                    offer: {
                        amount: m.amount, deliveryDays: m.deliveryDays, currency: rules.currency,
                        quantity: rules.quantity, accepted: m.action === 'accept',
                    },
                })
                await Negotiation.updateOne({ _id: n._id }, { roundsUsed: m.round })
            },
        })

        if (result.status !== 'AGREED') {
            await Negotiation.updateOne({ _id: n._id }, { status: 'NEGOTIATION_FAILED', roundsUsed: result.roundsUsed })
            await logEvent({ ...base, type: 'NEGOTIATION_FAILED', details: { reason: result.reason } })
            return
        }

        // The agents only propose terms. Deterministic code decides whether they are allowed.
        const terms = pickTerms(result.terms)
        const verdict = evaluateAgreement(rules, terms)
        const agreement = await Agreement.create({
            ...base, terms, validation: verdict,
            status: verdict.allowed ? 'PROPOSED' : 'POLICY_BLOCKED',
        })
        await Negotiation.updateOne({ _id: n._id }, {
            status: verdict.allowed ? 'AWAITING_APPROVAL' : 'POLICY_BLOCKED',
            agreementId: agreement._id,
            roundsUsed: result.roundsUsed,
        })
        await logEvent({
            ...base,
            type: verdict.allowed ? 'POLICY_PASSED' : 'POLICY_BLOCKED',
            details: { terms, reasons: verdict.reasons, checks: verdict.checks },
        })
    } catch (err) {
        await Negotiation.updateOne({ _id: n._id }, { status: 'NEGOTIATION_FAILED' })
        await logEvent({ ...base, type: 'NEGOTIATION_ERROR', details: { message: String(err.message).slice(0, 300) } })
    }
}

export default router
