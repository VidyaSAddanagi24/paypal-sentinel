import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import AuditTimeline from '../components/AuditTimeline'
import StatusBadge from '../components/StatusBadge'
import { formatDate, formatMoney } from '../lib/format'
import { EVENT_CATEGORIES } from '../lib/auditLabels'

/** Plain-text hash display with copy button — no dangerouslySetInnerHTML */
function HashDisplay({ value, label }) {
  const [copied, setCopied] = useState(false)
  const str = String(value ?? '')
  const isLong = str.length > 16
  const display = isLong ? str.slice(0, 10) + '...' + str.slice(-8) : str

  const handleCopy = () => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {label && <span className="text-xs font-semibold text-[#12171F]/60">{label}:</span>}
      <span
        title={str}
        className="font-mono text-xs bg-[#12171F]/5 border border-[#12171F]/10 rounded px-2 py-0.5 cursor-default select-all"
      >
        {display}
      </span>
      {isLong && (
        <button
          type="button"
          onClick={handleCopy}
          title="Copy full value"
          aria-label="Copy full value"
          className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center rounded hover:bg-[#12171F]/10 transition-colors text-[#12171F]/50 hover:text-[#12171F] cursor-pointer"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}
    </span>
  )
}

/** Section wrapper */
function Section({ title, icon, children, accent = '' }) {
  return (
    <section className={`rounded-2xl border p-5 sm:p-6 space-y-4 bg-white border-[#12171F]/10 shadow-sm ${accent}`}>
      <div className="flex items-center gap-2 pb-3 border-b border-[#12171F]/8">
        {icon && <span className="text-[#0B6B57]">{icon}</span>}
        <h2 className="text-base font-bold text-[#12171F]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

/** Row in a data grid */
function DataRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-1.5 border-b border-[#12171F]/5 last:border-0">
      <span className="text-xs font-semibold text-[#12171F]/50 uppercase tracking-wide sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-[#12171F] font-medium">{children}</span>
    </div>
  )
}

/**
 * Builds a plain-language verdict from the negotiation data.
 * Never evaluates policy rules — only reads from what the server already decided.
 */
function buildVerdict({ negotiation, agreement, authorization, events }) {
  const status = negotiation?.status
  const blockedEvents = (events || []).filter((e) =>
    EVENT_CATEGORIES.BLOCKED.includes(e.type)
  )
  const paymentCaptured = (events || []).some((e) => e.type === 'PAYMENT_CAPTURED')
  const driftBlocked = (events || []).some((e) => e.type === 'DRIFT_BLOCKED')
  const authExpired = (events || []).some((e) => e.type === 'AUTHORIZATION_EXPIRED')
  const policyBlocked = (events || []).some((e) => e.type === 'POLICY_BLOCKED')
  const policyPassed = (events || []).some((e) => e.type === 'POLICY_PASSED')
  const approved = (events || []).some((e) => e.type === 'APPROVED_BY_BUYER')
  const negFailed = (events || []).some((e) =>
    ['NEGOTIATION_FAILED', 'NEGOTIATION_ERROR', 'NEGOTIATION_INTERRUPTED'].includes(e.type)
  )

  if (paymentCaptured) {
    return {
      verdict: 'accepted',
      title: 'Deal Accepted and Payment Captured',
      summary:
        'The negotiation succeeded, all policy checks passed, you explicitly approved the exact terms, the Integrity Shield verified nothing changed, and the payment was captured by PayPal.',
    }
  }

  if (driftBlocked) {
    return {
      verdict: 'blocked',
      title: 'Payment Blocked — Agreement Tampered After Approval',
      summary:
        'The Integrity Shield detected that the agreed terms changed after you approved them. The cryptographic snapshot did not match the live agreement, so the payment was blocked to protect you.',
    }
  }

  if (authExpired) {
    return {
      verdict: 'blocked',
      title: 'Payment Blocked — Authorization Window Expired',
      summary:
        'The single-use authorization issued at approval time expired before the payment step was completed. A fresh approval would be required to proceed.',
    }
  }

  if (policyBlocked) {
    const reasons = (agreement?.validation?.reasons || []).filter(Boolean)
    return {
      verdict: 'blocked',
      title: 'Deal Blocked by Policy',
      summary:
        reasons.length > 0
          ? `The agreed terms violated your financial policy rules: ${reasons.join('; ')}.`
          : 'The agreed terms violated one or more of your financial policy constraints and were rejected before reaching payment.',
    }
  }

  if (negFailed) {
    const failEvent = [...(events || [])]
      .reverse()
      .find((e) => ['NEGOTIATION_FAILED', 'NEGOTIATION_ERROR', 'NEGOTIATION_INTERRUPTED'].includes(e.type))
    const reason =
      failEvent?.details?.reason ||
      failEvent?.details?.message ||
      'Agents were unable to reach an agreement within the allowed number of rounds.'
    return {
      verdict: 'failed',
      title: 'Negotiation Did Not Reach Agreement',
      summary: reason,
    }
  }

  if (status === 'APPROVED' || status === 'PAYPAL_ORDER_CREATED') {
    return {
      verdict: 'in-progress',
      title: 'Approved — Payment In Progress',
      summary:
        'You approved the terms and a PayPal order was created. Payment capture is pending completion of the PayPal checkout.',
    }
  }

  if (status === 'AWAITING_APPROVAL') {
    return {
      verdict: 'in-progress',
      title: 'Awaiting Your Approval',
      summary:
        'The agents reached consensus and the terms passed all policy checks. The deal is waiting for your explicit approval before any payment can proceed.',
    }
  }

  if (status === 'NEGOTIATING') {
    return {
      verdict: 'in-progress',
      title: 'Negotiation In Progress',
      summary: 'AI agents are currently bargaining. No outcome has been determined yet.',
    }
  }

  if (status === 'DRAFT') {
    return {
      verdict: 'in-progress',
      title: 'Not Started Yet',
      summary: 'This negotiation is in draft state and has not been started.',
    }
  }

  return {
    verdict: 'in-progress',
    title: 'Status: ' + (status || 'Unknown'),
    summary: 'The current state of this negotiation could not be summarised automatically.',
  }
}

const VERDICT_STYLES = {
  accepted: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  blocked: 'bg-rose-50 border-rose-200 text-rose-900',
  failed: 'bg-zinc-100 border-zinc-300 text-zinc-800',
  'in-progress': 'bg-amber-50 border-amber-200 text-amber-900',
}

const VERDICT_ICON_STYLES = {
  accepted: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-rose-100 text-rose-700',
  failed: 'bg-zinc-200 text-zinc-600',
  'in-progress': 'bg-amber-100 text-amber-700',
}

function VerdictIcon({ verdict }) {
  if (verdict === 'accepted') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
  if (verdict === 'blocked') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    )
  }
  if (verdict === 'failed') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

/** Authorization status badge */
function AuthStatusBadge({ status }) {
  const styles = {
    ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    CONSUMED: 'bg-sky-50 text-sky-800 border-sky-200',
    EXPIRED: 'bg-stone-100 text-stone-700 border-stone-300',
    REVOKED: 'bg-rose-50 text-rose-800 border-rose-200',
  }
  const cls = styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>
      {status || 'Unknown'}
    </span>
  )
}

/** Displays how much of the authorization window was used */
function AuthConsumedBar({ createdAt, expiresAt, consumedAt }) {
  if (!createdAt || !expiresAt) return null
  const start = new Date(createdAt).getTime()
  const end = new Date(expiresAt).getTime()
  const total = end - start
  if (total <= 0) return null
  const used = consumedAt
    ? new Date(consumedAt).getTime() - start
    : Math.min(Date.now() - start, total)
  const pct = Math.max(0, Math.min(100, (used / total) * 100))
  const consumed = consumedAt ? Math.round((new Date(consumedAt) - new Date(createdAt)) / 1000) : null
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[#12171F]/50">
        <span>Issued</span>
        <span>Expires</span>
      </div>
      <div className="h-2 rounded-full bg-[#12171F]/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#0B6B57] transition-all"
          style={{ width: `${pct.toFixed(1)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(pct)}% of authorization window used`}
        />
      </div>
      <div className="flex justify-between text-xs text-[#12171F]/50">
        <span>{formatDate(createdAt)}</span>
        <span>{formatDate(expiresAt)}</span>
      </div>
      {consumed !== null && (
        <p className="text-xs text-[#12171F]/60">
          Used after{' '}
          <span className="font-semibold font-num text-[#12171F]">
            {consumed}s
          </span>{' '}
          of the authorization window.
        </p>
      )}
    </div>
  )
}

export default function NegotiationAudit() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let ignore = false
    setLoading(true)
    setError(null)
    api.get(`/api/negotiations/${id}`)
      .then((res) => { if (!ignore) setData(res) })
      .catch((err) => {
        if (!ignore) {
          if (err.message?.toLowerCase().includes('not found') || err.message?.includes('404')) {
            setIsNotFound(true)
          } else {
            setError(err.message || 'Failed to load negotiation')
          }
        }
      })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#0B6B57] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#12171F]">Loading audit trail...</p>
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#12171F] mb-2">Negotiation Not Found</h2>
        <p className="text-sm text-[#12171F]/70 mb-6">
          The negotiation does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/audit"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all cursor-pointer"
        >
          Back to Audit Trail
        </Link>
      </div>
    )
  }

  if (error || !data?.negotiation) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#12171F] mb-1">Failed to Load Audit Trail</h2>
        <p className="text-sm text-rose-700 mb-6">{error || 'An unexpected error occurred.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    )
  }

  const { negotiation, agreement, events = [], authorization } = data
  const rules = negotiation.rules || {}
  const sellerProfile = negotiation.sellerProfile || {}
  const terms = agreement?.terms || {}
  const snapshot = agreement?.snapshot || {}
  const verdict = buildVerdict({ negotiation, agreement, authorization, events })
  const verdictStyle = VERDICT_STYLES[verdict.verdict] || VERDICT_STYLES['in-progress']
  const verdictIconStyle = VERDICT_ICON_STYLES[verdict.verdict] || VERDICT_ICON_STYLES['in-progress']

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Back links */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to={`/negotiations/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B6B57] hover:underline min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Negotiation Room
        </Link>
        <span className="text-[#12171F]/20 text-sm" aria-hidden="true">/</span>
        <Link
          to="/audit"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#12171F]/50 hover:text-[#0B6B57] hover:underline min-h-[44px]"
        >
          All Audits
        </Link>
      </div>

      {/* Page heading */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12171F] tracking-tight">
            {rules.product || sellerProfile.product || 'Negotiation'} — Audit Trail
          </h1>
          <p className="text-xs text-[#12171F]/50 mt-1 font-mono">ID: {id}</p>
        </div>
        <StatusBadge status={negotiation.status} />
      </div>

      {/* a. Plain-language verdict */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${verdictStyle}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${verdictIconStyle}`}>
            <VerdictIcon verdict={verdict.verdict} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold mb-1">{verdict.title}</h2>
            <p className="text-sm leading-relaxed opacity-90">{verdict.summary}</p>
          </div>
        </div>
      </div>

      {/* b. Buyer instructions & parsed financial rules */}
      <Section
        title="Buyer Instructions and Financial Rules"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      >
        {negotiation.instructions && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-[#12171F]/50 uppercase tracking-wide">Original Buyer Instructions</p>
            {/* Plain text — no HTML rendering */}
            <p className="text-sm text-[#12171F] leading-relaxed bg-[#12171F]/3 rounded-xl p-3 border border-[#12171F]/8 whitespace-pre-wrap break-words">
              {negotiation.instructions}
            </p>
          </div>
        )}

        {rules && Object.keys(rules).length > 0 && (
          <div className="space-y-1 mt-2">
            <p className="text-xs font-bold text-[#12171F]/50 uppercase tracking-wide">Parsed Financial Rules</p>
            <div className="rounded-xl border border-[#12171F]/10 overflow-hidden divide-y divide-[#12171F]/5">
              {rules.product && <DataRow label="Product">{rules.product}</DataRow>}
              {rules.quantity != null && (
                <DataRow label="Quantity">
                  <span className="font-num">{rules.quantity}</span> {rules.quantity === 1 ? 'unit' : 'units'}
                </DataRow>
              )}
              {rules.maxBudget != null && (
                <DataRow label="Max Budget">
                  <span className="font-num">{formatMoney(rules.maxBudget, rules.currency)}</span>
                </DataRow>
              )}
              {rules.currency && <DataRow label="Currency">{rules.currency}</DataRow>}
              {rules.maxDeliveryDays != null && (
                <DataRow label="Max Delivery">
                  <span className="font-num">{rules.maxDeliveryDays}</span> days
                </DataRow>
              )}
              {rules.requiresApproval != null && (
                <DataRow label="Requires Approval">{rules.requiresApproval ? 'Yes' : 'No'}</DataRow>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* c. Seller profile (simulated — never show minPrice) */}
      {sellerProfile && Object.keys(sellerProfile).length > 0 && (
        <Section
          title="Seller Profile (Simulated)"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <p className="text-xs text-[#12171F]/50 italic mb-2">
            This seller is simulated. The seller's minimum reserve price is never disclosed.
          </p>
          <div className="rounded-xl border border-[#12171F]/10 overflow-hidden divide-y divide-[#12171F]/5">
            {sellerProfile.name && <DataRow label="Name">{sellerProfile.name}</DataRow>}
            {sellerProfile.sellerId && <DataRow label="Seller ID">{sellerProfile.sellerId}</DataRow>}
            {sellerProfile.product && <DataRow label="Product">{sellerProfile.product}</DataRow>}
            {sellerProfile.listPrice != null && (
              <DataRow label="List Price">
                <span className="font-num">{formatMoney(sellerProfile.listPrice, sellerProfile.currency)}</span>
              </DataRow>
            )}
            {sellerProfile.deliveryDays != null && (
              <DataRow label="Delivery Days">
                <span className="font-num">{sellerProfile.deliveryDays}</span> days
              </DataRow>
            )}
            {sellerProfile.simulated != null && (
              <DataRow label="Mode">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Simulation Sandbox
                </span>
              </DataRow>
            )}
          </div>
        </Section>
      )}

      {/* d. Final agreement terms + snapshot hash + approval timestamp */}
      {agreement && (
        <Section
          title="Final Agreement Terms and Sealed Snapshot"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        >
          {Object.keys(terms).length > 0 && (
            <div className="space-y-1 mb-4">
              <p className="text-xs font-bold text-[#12171F]/50 uppercase tracking-wide">Agreed Terms</p>
              <div className="rounded-xl border border-[#12171F]/10 overflow-hidden divide-y divide-[#12171F]/5">
                {terms.product && <DataRow label="Product">{terms.product}</DataRow>}
                {terms.quantity != null && (
                  <DataRow label="Quantity"><span className="font-num">{terms.quantity}</span> units</DataRow>
                )}
                {terms.amount != null && (
                  <DataRow label="Amount">
                    <span className="font-num font-bold text-[#0B6B57]">
                      {formatMoney(terms.amount, terms.currency)}
                    </span>
                  </DataRow>
                )}
                {terms.currency && <DataRow label="Currency">{terms.currency}</DataRow>}
                {terms.deliveryDays != null && (
                  <DataRow label="Delivery Days"><span className="font-num">{terms.deliveryDays}</span> days</DataRow>
                )}
                {terms.sellerName && <DataRow label="Seller">{terms.sellerName}</DataRow>}
                {terms.sellerId && <DataRow label="Seller ID">{terms.sellerId}</DataRow>}
              </div>
            </div>
          )}

          {snapshot.hash && (
            <div className="space-y-1 p-3 rounded-xl bg-[#0B6B57]/5 border border-[#0B6B57]/15">
              <p className="text-xs font-bold text-[#0B6B57] uppercase tracking-wide">Sealed Snapshot</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#12171F]/60 font-semibold">Hash:</span>
                <HashDisplay value={snapshot.hash} />
              </div>
              {snapshot.approvedAt && (
                <p className="text-xs text-[#12171F]/60">
                  Approved at:{' '}
                  <span className="font-semibold text-[#12171F]">{formatDate(snapshot.approvedAt)}</span>
                </p>
              )}
            </div>
          )}
        </Section>
      )}

      {/* e. Authorization state */}
      {authorization && (
        <Section
          title="Authorization State"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-[#12171F]/50 uppercase tracking-wide">Status:</span>
              <AuthStatusBadge status={authorization.status} />
            </div>

            <AuthConsumedBar
              createdAt={authorization.createdAt}
              expiresAt={authorization.expiresAt}
              consumedAt={authorization.consumedAt}
            />

            <div className="rounded-xl border border-[#12171F]/10 overflow-hidden divide-y divide-[#12171F]/5">
              <DataRow label="Issued">{formatDate(authorization.createdAt)}</DataRow>
              <DataRow label="Expires">{formatDate(authorization.expiresAt)}</DataRow>
              {authorization.consumedAt && (
                <DataRow label="Consumed">{formatDate(authorization.consumedAt)}</DataRow>
              )}
              {authorization.snapshotHash && (
                <DataRow label="Snapshot Hash">
                  <HashDisplay value={authorization.snapshotHash} />
                </DataRow>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* f. PayPal references */}
      {authorization && (authorization.paypalOrderId || authorization.paypalCaptureId) && (
        <Section
          title="PayPal References"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        >
          <div className="rounded-xl border border-[#12171F]/10 overflow-hidden divide-y divide-[#12171F]/5">
            {authorization.paypalOrderId && (
              <DataRow label="Order ID">
                <HashDisplay value={authorization.paypalOrderId} />
              </DataRow>
            )}
            {authorization.paypalCaptureId && (
              <DataRow label="Capture ID">
                <HashDisplay value={authorization.paypalCaptureId} />
              </DataRow>
            )}
          </div>
        </Section>
      )}

      {/* g. Audit Timeline */}
      <Section
        title="Event Timeline"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <AuditTimeline events={events} />
      </Section>

      {/* h. Link back to Negotiation Room */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          to={`/negotiations/${id}`}
          className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Negotiation Room
        </Link>
        <Link
          to="/audit"
          className="inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white text-[#12171F] border border-[#12171F]/15 hover:border-[#0B6B57]/40 hover:text-[#0B6B57] transition-all cursor-pointer"
        >
          All Audit Events
        </Link>
      </div>
    </div>
  )
}

