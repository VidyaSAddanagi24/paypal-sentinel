import Agreement from '../models/Agreement.js'
import Authorization from '../models/Authorization.js'
import Negotiation from '../models/Negotiation.js'
import { evaluateAgreement } from './policyEngine.js'
import { pickTerms, hashTerms } from './snapshot.js'
import { logEvent } from './audit.js'

export const AUTH_TTL_MS = Number(process.env.AUTH_TTL_MINUTES || 15) * 60 * 1000 // single-use authorization lifetime

export async function approveAgreement(negotiation, userId) {
    const base = { negotiationId: negotiation._id, userId }
    if (negotiation.status !== 'AWAITING_APPROVAL' || !negotiation.agreementId) {
        return { ok: false, status: 409, error: 'This negotiation is not awaiting approval' }
    }
    const agreement = await Agreement.findOne({ _id: negotiation.agreementId, userId })
    if (!agreement || agreement.status !== 'PROPOSED') {
        return { ok: false, status: 409, error: 'This agreement cannot be approved' }
    }

    // Re-validate now. Never rely on an earlier result.
    const terms = pickTerms(agreement.terms.toObject())
    const verdict = evaluateAgreement(negotiation.toObject().rules, terms)
    if (!verdict.allowed) {
        await Agreement.updateOne({ _id: agreement._id }, { status: 'POLICY_BLOCKED', validation: verdict })
        await Negotiation.updateOne({ _id: negotiation._id }, { status: 'POLICY_BLOCKED' })
        await logEvent({ ...base, type: 'APPROVAL_BLOCKED', details: { reasons: verdict.reasons } })
        return { ok: false, status: 422, error: 'Agreement no longer passes the policy checks', reasons: verdict.reasons }
    }

    const hash = hashTerms(terms)
    const approvedAt = new Date()
    // Atomic: only a PROPOSED agreement can be approved, and only once.
    const frozen = await Agreement.findOneAndUpdate(
        { _id: agreement._id, userId, status: 'PROPOSED' },
        { status: 'APPROVED', snapshot: { terms, hash, approvedAt } },
        { new: true }
    )
    if (!frozen) return { ok: false, status: 409, error: 'This agreement was already approved' }

    const expiresAt = new Date(approvedAt.getTime() + AUTH_TTL_MS)
    const authorization = await Authorization.create({
        agreementId: frozen._id, userId, snapshotHash: hash, expiresAt,
    })
    await Negotiation.updateOne({ _id: negotiation._id }, { status: 'APPROVED' })
    await logEvent({
        ...base, type: 'APPROVED_BY_BUYER',
        details: { snapshotHash: hash, terms, expiresAt, authorizationId: authorization._id },
    })
    return { ok: true, snapshotHash: hash, expiresAt, terms }
}