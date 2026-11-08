import { hashTerms } from './snapshot.js'

const minor = (n) => Math.round(Number(n) * 100)

// Runs right before capture. Pure function: no database, no network.
// Compares the approved snapshot, the authorization and the PayPal order.
export function verifyBeforeCapture({ agreement, authorization, order, now = new Date() }) {
    const checks = []
    const add = (rule, passed, message) => checks.push({ rule, passed: Boolean(passed), message })

    const snap = agreement?.snapshot
    const terms = snap?.terms
    const unit = order?.purchase_units?.[0]

    add('agreement_approved', agreement?.status === 'APPROVED' && Boolean(terms), 'Agreement was approved by the buyer')
    add('snapshot_intact', Boolean(terms) && hashTerms(terms) === snap.hash, 'Approved snapshot has not been altered')
    add('terms_unchanged', Boolean(terms) && hashTerms(agreement.terms) === snap.hash, 'Agreement terms still equal the approved terms')
    add('authorization_matches',
        Boolean(authorization) && String(authorization.agreementId) === String(agreement?._id) && authorization.snapshotHash === snap?.hash,
        'Authorization belongs to this agreement and snapshot')
    add('authorization_active', authorization?.status === 'ACTIVE', 'Authorization is active')
    add('authorization_unused', Boolean(authorization) && authorization.consumedAt == null, 'Authorization has not been used')
    add('authorization_not_expired', Boolean(authorization) && new Date(authorization.expiresAt) > now, 'Authorization has not expired')
    add('order_amount', Boolean(terms && unit?.amount?.value) && minor(unit.amount.value) === minor(terms.amount), 'Order amount equals the approved amount')
    add('order_currency', Boolean(terms) && unit?.amount?.currency_code === terms.currency, 'Order currency equals the approved currency')
    add('order_merchant', Boolean(terms) && unit?.reference_id === terms.sellerId, 'Order merchant equals the approved seller')
    add('order_agreement', Boolean(agreement) && unit?.custom_id === String(agreement._id), 'Order refers to this agreement')

    const failed = checks.filter((c) => !c.passed)
    return { ok: failed.length === 0, checks, reasons: failed.map((c) => `Blocked: ${c.message} (check failed: ${c.rule})`) }
}