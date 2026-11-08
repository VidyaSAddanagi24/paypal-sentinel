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
import { pickTerms } from '../services/snapshot.js'
import { approveAgreement } from '../services/approval.js'
import { logEvent } from '../services/audit.js'

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
    } catch (err) {
        console.error('parse failed:', err.message)
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

// 3b. My audit trail across all negotiations. Must stay above '/:id'.
router.get('/audit/all', async (req, res, next) => {
    try {
        const events = await AuditEvent.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100)
        res.json({ events })
    } catch (err) {
        next(err)
    }
})

// 4. One negotiation with transcript, agreement, audit events and authorization. The frontend polls this.
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

// 6. Buyer explicitly approves the exact agreement. Freezes the snapshot and issues the authorization.
router.post('/:id/approve', loadOwned, async (req, res, next) => {
    try {
        const r = await approveAgreement(req.negotiation, req.user._id)
        if (!r.ok) return res.status(r.status).json({ error: r.error, reasons: r.reasons })
        res.json({ approved: true, snapshotHash: r.snapshotHash, expiresAt: r.expiresAt, terms: r.terms })
    } catch (err) {
        next(err)
    }
})

// 7. DEMO TOOL, off unless ENABLE_DEMO_TOOLS=true. Changes the agreed price AFTER approval,
//    to show the Integrity Shield blocking the payment.
router.post('/:id/simulate-drift', loadOwned, async (req, res, next) => {
    try {
        if (process.env.ENABLE_DEMO_TOOLS !== 'true') return res.status(404).json({ error: 'Not found' })
        const n = req.negotiation
        if (!['APPROVED', 'PAYPAL_ORDER_CREATED'].includes(n.status) || !n.agreementId) {
            return res.status(409).json({ error: 'Tampering can only be demonstrated on an approved, unpaid deal' })
        }
        const agreement = await Agreement.findOne({ _id: n.agreementId, userId: req.user._id })
        if (!agreement) return res.status(404).json({ error: 'Not found' })

        const originalAmount = agreement.terms.amount
        const tamperedAmount = Math.round(originalAmount * 1.15)
        await Agreement.updateOne({ _id: agreement._id }, { $set: { 'terms.amount': tamperedAmount } })
        await logEvent({
            negotiationId: n._id, userId: req.user._id, type: 'DEMO_TAMPER_APPLIED',
            details: { originalAmount, tamperedAmount },
        })
        res.json({
            message: `Demo tamper applied: amount changed from ${originalAmount} to ${tamperedAmount}. The next payment step will be blocked.`,
            originalAmount,
            tamperedAmount,
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
            console.log('negotiation ended:', result.reason)
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
        console.error('negotiation error:', err.message)
        await Negotiation.updateOne({ _id: n._id }, { status: 'NEGOTIATION_FAILED' })
        await logEvent({ ...base, type: 'NEGOTIATION_ERROR', details: { message: String(err.message).slice(0, 300) } })
    }
}

export default router