import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { formatMoney, formatDate } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import Countdown from '../components/Countdown'
import ShieldChecks from '../components/ShieldChecks'

// PayPal return URL uses ?paypal=return (from payments.js returnUrl)
// PayPal cancel URL uses ?paypal=cancel

/** Only redirect to URLs whose host ends with paypal.com */
function isSafePayPalUrl(url) {
  try {
    const u = new URL(url)
    return u.hostname === 'paypal.com' || u.hostname.endsWith('.paypal.com')
  } catch {
    return false
  }
}

export default function Checkout() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()

  const paypalParam = searchParams.get('paypal') // 'return' | 'cancel' | null
  const isReturn = paypalParam === 'return'
  const isCancel = paypalParam === 'cancel'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  // Order creation
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [orderError, setOrderError] = useState(null)
  const [unsafeUrlError, setUnsafeUrlError] = useState(null)

  // Capture
  const [capturing, setCapturing] = useState(false)
  const [captureError, setCaptureError] = useState(null)
  const [captureBlocked, setCaptureBlocked] = useState(null) // { reasons, checks }
  const [captureResult, setCaptureResult] = useState(null)  // { captured, orderId, captureId, paymentStatus }

  // Demo tools
  const [demoOpen, setDemoOpen] = useState(false)
  const [driftLoading, setDriftLoading] = useState(false)
  const [driftResult, setDriftResult] = useState(null)
  const [driftError, setDriftError] = useState(null)
  const [demoDisabled, setDemoDisabled] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await api.get(`/api/negotiations/${id}`)
      setData(res)
    } catch (err) {
      setFetchError(err.message || 'Failed to load deal')
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
        <p className="text-sm font-semibold text-[#12171F]">Loading checkout…</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-rose-700">{fetchError}</p>
        <button type="button" onClick={load}
          className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 cursor-pointer">
          Retry
        </button>
      </div>
    )
  }

  const negotiation = data?.negotiation
  const agreement = data?.agreement
  const authorization = data?.authorization
  const status = negotiation?.status

  // ── Must be APPROVED or PAYPAL_ORDER_CREATED (or CAPTURED to show receipt) ──
  const allowedStatuses = ['APPROVED', 'PAYPAL_ORDER_CREATED', 'CAPTURED']
  if (!allowedStatuses.includes(status)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 space-y-3">
          <h2 className="text-base font-bold text-amber-900">Checkout Not Available</h2>
          <p className="text-sm text-amber-900/80">
            Checkout requires an approved agreement. Current status is{' '}
            <strong>{status || 'unknown'}</strong>. Please approve the deal first.
          </p>
          {status && <StatusBadge status={status} />}
        </div>
        <Link to={`/negotiations/${id}/approve`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B6B57] hover:underline">
          Go to Approval Page
        </Link>
      </div>
    )
  }

  // ── Expiry check ─────────────────────────────────────────────────────────────
  const authExpired = authorization && new Date(authorization.expiresAt) <= new Date()
  const authActive = authorization?.status === 'ACTIVE' && !authExpired
  const expiresAt = authorization?.expiresAt

  const terms = agreement?.snapshot?.terms ?? agreement?.terms ?? {}

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleCreateOrder() {
    setCreatingOrder(true)
    setOrderError(null)
    setUnsafeUrlError(null)
    try {
      const res = await api.post(`/api/payments/${id}/order`)
      const approveUrl = res.approveUrl
      if (!approveUrl) {
        setOrderError('No approval URL returned from server.')
        return
      }
      if (!isSafePayPalUrl(approveUrl)) {
        setUnsafeUrlError(`Refused to redirect: URL host is not paypal.com (got: ${approveUrl})`)
        return
      }
      window.location.assign(approveUrl)
    } catch (err) {
      setOrderError(err.message || 'Failed to create PayPal order')
    } finally {
      setCreatingOrder(false)
    }
  }

  async function handleCapture() {
    setCapturing(true)
    setCaptureError(null)
    setCaptureBlocked(null)
    try {
      const res = await api.post(`/api/payments/${id}/capture`)
      setCaptureResult(res)
    } catch (err) {
      const msg = err.message || ''
      // The server returns { blocked: true, reasons } on 409 drift block
      // apiFetch throws with the error string; we detect by keyword
      if (msg.toLowerCase().includes('integrity shield') || msg.toLowerCase().includes('blocked')) {
        // Re-fetch to get shield checks if available
        try {
          const refreshed = await api.get(`/api/negotiations/${id}`)
          setData(refreshed)
        } catch { /* ignore */ }
        setCaptureBlocked({ reasons: [msg] })
      } else {
        setCaptureError(msg || 'Capture failed')
      }
    } finally {
      setCapturing(false)
    }
  }

  async function handleSimulateDrift() {
    setDriftLoading(true)
    setDriftResult(null)
    setDriftError(null)
    try {
      const res = await api.post(`/api/negotiations/${id}/simulate-drift`)
      setDriftResult(res.message || 'Demo tamper applied.')
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('403') || msg.includes('404') || msg.includes('Not found') || msg.toLowerCase().includes('disabled')) {
        setDemoDisabled(true)
        setDriftError('Demo tools are disabled on this server.')
      } else if (msg.includes('409')) {
        setDriftError(msg)
      } else {
        setDriftError(msg || 'Simulate drift failed')
      }
    } finally {
      setDriftLoading(false)
    }
  }

  // ── Capture receipt (already captured) ───────────────────────────────────────
  if (status === 'CAPTURED' || captureResult?.captured) {
    const result = captureResult ?? {}
    const orderId = result.orderId ?? authorization?.paypalOrderId
    const captureId = result.captureId ?? authorization?.paypalCaptureId
    const paymentStatus = result.paymentStatus ?? 'COMPLETED'

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />

        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl">✓</span>
            <div>
              <h2 className="text-xl font-extrabold text-emerald-900">Payment Captured</h2>
              <p className="text-xs text-emerald-800/80">Transaction complete. No further action needed.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ReceiptCell label="PayPal Order ID" value={orderId ?? '—'} mono />
            <ReceiptCell label="Capture ID" value={captureId ?? '—'} mono />
            <ReceiptCell label="Amount" value={formatMoney(terms.amount, terms.currency)} />
            <ReceiptCell label="Currency" value={terms.currency ?? '—'} />
            <ReceiptCell label="Capture Status" value={paymentStatus} />
            {terms.sellerName && <ReceiptCell label="Seller" value={terms.sellerName} />}
          </div>
        </div>

        <Link to={`/negotiations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B6B57] hover:underline">
          Back to negotiation room
        </Link>
      </div>
    )
  }

  // ── Authorization expired: show message, do NOT offer payment ─────────────────
  if (authExpired || (authorization && authorization.status !== 'ACTIVE')) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />

        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-300 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-rose-900">Authorization Expired</h2>
          </div>
          <p className="text-sm text-rose-800 leading-relaxed">
            The authorization window for this agreement has expired{authorization?.expiresAt ? ` (${formatDate(authorization.expiresAt)})` : ''}.
            For security, payment cannot proceed with an expired authorization. A fresh approval is needed to generate a new authorization window.
          </p>
          <p className="text-xs text-rose-700">
            Authorization status: <strong>{authorization?.status ?? 'unknown'}</strong>
          </p>
        </div>

        <Link to={`/negotiations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B6B57] hover:underline">
          Return to negotiation room
        </Link>
      </div>
    )
  }

  // ── Capture blocked by Integrity Shield ───────────────────────────────────────
  if (captureBlocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />

        <div className="p-6 rounded-3xl bg-red-50 border border-red-400 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
            </svg>
            <h2 className="text-lg font-bold text-red-900">Payment Blocked by Integrity Shield</h2>
          </div>
          <p className="text-sm text-red-800">
            The Integrity Shield detected a discrepancy between the approved terms and the payment. No money was moved.
            A fresh approval is required.
          </p>
          {Array.isArray(captureBlocked.reasons) && captureBlocked.reasons.length > 0 && (
            <ul className="space-y-1.5">
              {captureBlocked.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">✗</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to={`/negotiations/${id}/approve`}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 cursor-pointer">
          Request Fresh Approval
        </Link>
      </div>
    )
  }

  // ── PayPal cancelled return ───────────────────────────────────────────────────
  if (isCancel) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />

        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 space-y-3">
          <h2 className="text-lg font-bold text-amber-900">PayPal Checkout Cancelled</h2>
          <p className="text-sm text-amber-800 leading-relaxed">
            You cancelled the PayPal checkout. No payment was made and your authorization is still active
            (if not expired). You can retry below.
          </p>
          {expiresAt && (
            <Countdown expiresAt={expiresAt} label="Authorization expires in" />
          )}
        </div>

        <ApprovedTermsCard terms={terms} />

        <button
          type="button"
          onClick={handleCreateOrder}
          disabled={creatingOrder}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all shadow-md shadow-[#0B6B57]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creatingOrder ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Order…</span>
            </>
          ) : (
            <span>Retry PayPal Checkout</span>
          )}
        </button>

        {orderError && <ErrorBanner>{orderError}</ErrorBanner>}
        {unsafeUrlError && <ErrorBanner>{unsafeUrlError}</ErrorBanner>}
      </div>
    )
  }

  // ── PayPal returned (token in URL = buyer approved at PayPal) ─────────────────
  if (isReturn) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <BackLink id={id} />

        <div className="p-5 rounded-3xl bg-sky-50 border border-sky-300 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
            <h2 className="text-base font-bold text-sky-900">Payment approved at PayPal — ready to capture</h2>
          </div>
          <p className="text-xs text-sky-800">
            You approved the payment on PayPal's site. Click the button below to complete the capture.
            The Integrity Shield will verify terms before any money moves.
          </p>
          {expiresAt && <Countdown expiresAt={expiresAt} label="Authorization expires in" />}
        </div>

        <ApprovedTermsCard terms={terms} />

        {captureError && <ErrorBanner>{captureError}</ErrorBanner>}

        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all shadow-md shadow-[#0B6B57]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {capturing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Capturing Payment…</span>
            </>
          ) : (
            <span>Capture Payment</span>
          )}
        </button>

        <DemoTools
          id={id}
          open={demoOpen}
          onToggle={() => setDemoOpen((p) => !p)}
          onSimulate={handleSimulateDrift}
          loading={driftLoading}
          result={driftResult}
          error={driftError}
          disabled={demoDisabled}
          status={status}
        />
      </div>
    )
  }

  // ── Default: Step 1 — create order ───────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <BackLink id={id} />

      <div>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-extrabold text-[#12171F] tracking-tight">PayPal Checkout</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-[#12171F]/60">
          Your agreement is approved and authorized. Complete payment via PayPal below.
        </p>
      </div>

      {/* Countdown */}
      {expiresAt && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#12171F]/70">Authorization:</span>
          <Countdown expiresAt={expiresAt} label="Expires in" />
        </div>
      )}

      {/* Approved terms */}
      <ApprovedTermsCard terms={terms} />

      {/* Step 1 info */}
      <div className="p-4 rounded-2xl bg-[#F4F5F1] border border-[#12171F]/10 text-sm text-[#12171F]/80 space-y-1">
        <p className="font-semibold text-[#12171F]">Step 1 of 2 — Create PayPal Order</p>
        <p>Clicking the button below will create a PayPal order and redirect you to PayPal to authorize the payment.
          You will be returned here to complete the capture.</p>
      </div>

      {orderError && <ErrorBanner>{orderError}</ErrorBanner>}
      {unsafeUrlError && <ErrorBanner>{unsafeUrlError}</ErrorBanner>}

      <button
        type="button"
        onClick={handleCreateOrder}
        disabled={creatingOrder}
        className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#003087] text-white hover:bg-[#003087]/90 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creatingOrder ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Creating PayPal Order…</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.5 2h9C18.878 2 21 4.122 21 6.5S18.878 11 16.5 11H13l-1 7H8l1-7H7C4.791 7 3 5.209 3 3v-.5A.5.5 0 013.5 2H7.5z" opacity=".4"/>
              <path d="M5.5 11h3l-1 7H4l1-7z"/>
            </svg>
            <span>Create PayPal Order</span>
          </>
        )}
      </button>

      {/* If order already exists (PAYPAL_ORDER_CREATED status), show capture option */}
      {status === 'PAYPAL_ORDER_CREATED' && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-300 space-y-3">
          <p className="text-sm font-semibold text-sky-900">
            A PayPal order was already created. If you have already approved it on PayPal, you can capture it now.
          </p>
          {captureError && <ErrorBanner>{captureError}</ErrorBanner>}
          <button
            type="button"
            onClick={handleCapture}
            disabled={capturing}
            className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {capturing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Capturing…</span>
              </>
            ) : (
              <span>Capture Payment</span>
            )}
          </button>
        </div>
      )}

      <DemoTools
        id={id}
        open={demoOpen}
        onToggle={() => setDemoOpen((p) => !p)}
        onSimulate={handleSimulateDrift}
        loading={driftLoading}
        result={driftResult}
        error={driftError}
        disabled={demoDisabled}
        status={status}
      />
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

function ApprovedTermsCard({ terms }) {
  if (!terms) return null
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#12171F]/10 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-[#12171F]">Approved Terms</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {terms.product && <TermCell label="Product" value={terms.product} />}
        {terms.quantity != null && <TermCell label="Quantity" value={`${terms.quantity} units`} />}
        {terms.sellerName && <TermCell label="Seller" value={terms.sellerName} />}
        {terms.amount != null && <TermCell label="Amount" value={formatMoney(terms.amount, terms.currency)} green />}
        {terms.currency && <TermCell label="Currency" value={terms.currency} />}
        {terms.deliveryDays != null && <TermCell label="Delivery" value={`${terms.deliveryDays} days`} />}
      </div>
    </div>
  )
}

function TermCell({ label, value, green }) {
  return (
    <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
      <span className="text-[11px] text-[#12171F]/60 block font-medium">{label}</span>
      <span className={`text-sm font-bold truncate block ${green ? 'text-[#0B6B57]' : 'text-[#12171F]'}`}>
        {value}
      </span>
    </div>
  )
}

function ReceiptCell({ label, value, mono }) {
  return (
    <div className="p-3 rounded-xl bg-white border border-emerald-200">
      <span className="text-[11px] text-emerald-700 block font-semibold uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold text-emerald-900 break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function ErrorBanner({ children }) {
  return (
    <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
      <strong className="font-bold block mb-0.5">Error</strong>
      {children}
    </div>
  )
}

function DemoTools({ id, open, onToggle, onSimulate, loading, result, error, disabled, status }) {
  const canSimulate = ['APPROVED', 'PAYPAL_ORDER_CREATED'].includes(status)

  return (
    <div className="rounded-2xl border border-[#12171F]/10 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#F4F5F1] text-[#12171F] hover:bg-[#e8e9e5] transition-colors cursor-pointer"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-[#12171F]/70">
          Demo Tools — Integrity Shield Demonstration
        </span>
        <svg
          className={`w-4 h-4 text-[#12171F]/60 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-white border-t border-[#12171F]/10">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
            <strong className="font-bold block mb-1">⚠ Demo feature — not a real transaction tool</strong>
            This simulates a seller tampering with the agreed price (+15%) after your approval, to demonstrate that
            the Integrity Shield will detect and block the subsequent payment.
          </div>

          {disabled ? (
            <p className="text-xs text-[#12171F]/60 font-semibold">Demo tools are disabled on this server.</p>
          ) : !canSimulate ? (
            <p className="text-xs text-[#12171F]/60">
              Tampering can only be demonstrated on an approved, unpaid deal (status: APPROVED or PAYPAL_ORDER_CREATED).
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={onSimulate}
                disabled={loading}
                className="min-h-[40px] px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Simulating…</span>
                  </>
                ) : (
                  <span>Simulate Seller Tampering (+15% amount)</span>
                )}
              </button>

              {result && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {result}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

