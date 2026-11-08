import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatMoney, formatDate } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import PolicyChecks from '../components/PolicyChecks'
import Countdown from '../components/Countdown'

// Statuses that mean "already approved — continue to checkout"
const ALREADY_APPROVED = ['APPROVED', 'PAYPAL_ORDER_CREATED', 'CAPTURED']

export default function Approval() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Form state
  const [confirmed, setConfirmed] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approveError, setApproveError] = useState(null)

  // Post-approval state
  const [approved, setApproved] = useState(null) // { snapshotHash, expiresAt, terms }

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await api.get(`/api/negotiations/${id}`)
      setData(res)
    } catch (err) {
      setFetchError(err.message || 'Failed to load negotiation')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center">
        <div className="w-10 h-10 border-3 border-[#0B6B57] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#12171F]">Loading approval details…</p>
      </div>
    )
  }

  // ── Fetch error ───────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-rose-700 mb-4">{fetchError}</p>
        <button
          type="button"
          onClick={load}
          className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    )
  }

  const negotiation = data?.negotiation
  const agreement = data?.agreement
  const authorization = data?.authorization
  const status = negotiation?.status

  // ── If we just successfully approved (or were already approved), show summary ─
  if (approved || ALREADY_APPROVED.includes(status)) {
    const hash = approved?.snapshotHash ?? authorization?.snapshotHash ?? agreement?.snapshot?.hash
    const expiresAt = approved?.expiresAt ?? authorization?.expiresAt
    const terms = approved?.terms ?? agreement?.snapshot?.terms ?? agreement?.terms ?? {}

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />

        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-300 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">✓</span>
            <div>
              <h2 className="text-lg font-extrabold text-emerald-900">Agreement Approved</h2>
              <p className="text-xs text-emerald-800/80">Authorization issued. Payment is not yet made.</p>
            </div>
          </div>

          <TermsGrid terms={terms} />

          {hash && (
            <div className="p-3 rounded-xl bg-[#0D1F1A] text-white border border-[#0B6B57]/40 space-y-1">
              <span className="text-[11px] uppercase font-bold text-[#6EE0BE] tracking-wider block">Snapshot Hash (SHA-256)</span>
              <code
                className="font-mono text-xs text-white/90 break-all block"
                title={hash}
              >
                {hash.length > 64 ? `${hash.slice(0, 32)}…${hash.slice(-16)}` : hash}
              </code>
            </div>
          )}

          {expiresAt && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-emerald-900 font-semibold">Authorization window:</span>
              <Countdown expiresAt={expiresAt} label="Expires in" />
            </div>
          )}
        </div>

        <Link
          to={`/negotiations/${id}/checkout`}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all shadow-md shadow-[#0B6B57]/20 cursor-pointer"
        >
          <span>Proceed to PayPal Checkout</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    )
  }

  // ── Status gate: only AWAITING_APPROVAL may proceed ──────────────────────────
  if (status !== 'AWAITING_APPROVAL') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-base font-bold text-amber-900">Not Ready for Approval</h2>
          </div>
          <p className="text-sm text-amber-900/80">
            This negotiation cannot be approved right now. The approval page requires status{' '}
            <strong>AWAITING_APPROVAL</strong>; current status is{' '}
            <strong>{status || 'unknown'}</strong>.
          </p>
          {status && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-amber-800 font-semibold">Current status:</span>
              <StatusBadge status={status} />
            </div>
          )}
          <StatusExplanation status={status} />
        </div>
        <Link
          to={`/negotiations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B6B57] hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to negotiation room
        </Link>
      </div>
    )
  }

  // ── Agreement loaded — guard against missing agreement ───────────────────────
  if (!agreement) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-rose-700">Agreement data is missing. Please reload.</p>
        <button type="button" onClick={load} className="mt-4 min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 cursor-pointer">
          Reload
        </button>
      </div>
    )
  }

  const terms = agreement.terms || {}

  // ── Handle approve button ────────────────────────────────────────────────────
  async function handleApprove() {
    setApproving(true)
    setApproveError(null)
    try {
      const res = await api.post(`/api/negotiations/${id}/approve`)
      setApproved({
        snapshotHash: res.snapshotHash,
        expiresAt: res.expiresAt,
        terms: res.terms,
      })
    } catch (err) {
      // 409 "already approved" — if status allows, just go to checkout
      const msg = err.message || ''
      if (msg.includes('409') || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('approved')) {
        // Re-fetch to get current state and show the approved UI
        try {
          const refreshed = await api.get(`/api/negotiations/${id}`)
          setData(refreshed)
          if (ALREADY_APPROVED.includes(refreshed?.negotiation?.status)) {
            // Will re-render into the "already approved" branch above
            return
          }
        } catch {
          // ignore refresh error; fall through to show error
        }
      }
      setApproveError(msg || 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  // ── Main approval form ────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <BackLink id={id} />

      {/* Page header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-extrabold text-[#12171F] tracking-tight">Review &amp; Approve Agreement</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-[#12171F]/60">
          Policy engine passed. Review the exact final terms before issuing authorization.
        </p>
      </div>

      {/* Legal notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold leading-relaxed">
        You are approving exactly this transaction. <strong>Payment is not made until you complete PayPal checkout.</strong>
      </div>

      {/* Final terms card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#12171F]/10 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#12171F]">Final Agreed Terms</h2>
        <TermsGrid terms={terms} />
      </div>

      {/* Policy engine verdict */}
      <PolicyChecks agreement={agreement} />

      {/* Confirm checkbox + button */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#12171F]/10 shadow-sm space-y-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-[#0B6B57] shrink-0 cursor-pointer"
          />
          <span className="text-sm font-semibold text-[#12171F] leading-snug">
            I confirm these are the exact terms I approve. I understand that approving does not move money; PayPal checkout is the payment step.
          </span>
        </label>

        {approveError && (
          <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            <strong className="font-bold block mb-0.5">Approval failed</strong>
            {approveError}
          </div>
        )}

        <button
          type="button"
          onClick={handleApprove}
          disabled={!confirmed || approving}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all shadow-md shadow-[#0B6B57]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {approving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Approving…</span>
            </>
          ) : (
            <span>Approve This Deal</span>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function BackLink({ id }) {
  return (
    <Link
      to={`/negotiations/${id}`}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B6B57] hover:underline min-h-[44px]"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Negotiation Room
    </Link>
  )
}

function TermsGrid({ terms }) {
  if (!terms) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {terms.product && (
        <TermCell label="Product" value={terms.product} title={terms.product} />
      )}
      {terms.quantity != null && (
        <TermCell label="Quantity" value={`${terms.quantity} units`} />
      )}
      {terms.sellerName && (
        <TermCell label="Seller / Merchant" value={terms.sellerName} title={terms.sellerName} />
      )}
      {terms.amount != null && (
        <TermCell label="Amount" value={formatMoney(terms.amount, terms.currency)} bold green />
      )}
      {terms.currency && (
        <TermCell label="Currency" value={terms.currency} />
      )}
      {terms.deliveryDays != null && (
        <TermCell label="Delivery" value={`${terms.deliveryDays} days`} />
      )}
    </div>
  )
}

function TermCell({ label, value, title, bold, green }) {
  return (
    <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
      <span className="text-[11px] text-[#12171F]/60 block font-medium">{label}</span>
      <span
        className={`text-sm font-bold truncate block ${green ? 'text-[#0B6B57]' : 'text-[#12171F]'} ${bold ? 'text-base' : ''}`}
        title={title}
      >
        {value}
      </span>
    </div>
  )
}

function StatusExplanation({ status }) {
  const explanations = {
    DRAFT: 'The negotiation has not started yet. Start it from the negotiation room first.',
    NEGOTIATING: 'Agents are still negotiating. Wait for them to reach an agreement.',
    NEGOTIATION_FAILED: 'The agents could not agree on terms. No agreement can be approved.',
    POLICY_BLOCKED: 'The agreed terms violated buyer policy constraints. No approval is possible.',
    CAPTURED: 'Payment has already been captured for this negotiation.',
    BLOCKED_DRIFT: 'Payment was blocked by the Integrity Shield. A new negotiation is required.',
    EXPIRED: 'The authorization window has expired. A new negotiation and approval is required.',
  }
  const msg = status ? explanations[status] : null
  if (!msg) return null
  return (
    <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">{msg}</p>
  )
}

