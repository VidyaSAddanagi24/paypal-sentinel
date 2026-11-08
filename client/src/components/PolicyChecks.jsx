import React from 'react'
import { formatMoney } from '../lib/format'
import StatusBadge from './StatusBadge'

function formatRuleName(rule) {
  switch (rule) {
    case 'budget':
      return 'Budget Limit'
    case 'currency':
      return 'Currency Match'
    case 'delivery':
      return 'Delivery SLA'
    case 'quantity':
      return 'Quantity Integrity'
    case 'product':
      return 'Product Match'
    case 'amount_valid':
      return 'Amount Validity'
    case 'delivery_valid':
      return 'Delivery SLA Validity'
    case 'quantity_valid':
      return 'Quantity Validity'
    case 'seller_present':
      return 'Seller Identity'
    default:
      return String(rule || 'Rule Check').replace(/_/g, ' ')
  }
}

export default function PolicyChecks({ agreement }) {
  if (!agreement) return null

  const terms = agreement.terms || {}
  const validation = agreement.validation
  const checks = Array.isArray(validation?.checks) ? validation.checks : []
  const hasValidation = checks.length > 0 || typeof validation?.allowed === 'boolean'

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#12171F]/10 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#12171F]/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0B6B57]/10 text-[#0B6B57] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#12171F]">
              Policy Engine Verdict &amp; Agreed Terms
            </h3>
          </div>
          <p className="text-xs text-[#12171F]/60 mt-1">
            Deterministic code verification applied to negotiated counteroffers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {agreement.status && (
            <StatusBadge status={agreement.status} />
          )}
          {hasValidation && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                validation?.allowed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {validation?.allowed ? '✓ Policy Passed' : '✗ Policy Blocked'}
            </span>
          )}
        </div>
      </div>

      {/* Agreed Contract Terms */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#12171F]/60 mb-2.5">
          Agreed Contract Terms
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
            <span className="text-[11px] text-[#12171F]/60 block font-medium">Agreed Amount</span>
            <span className="text-base font-extrabold text-[#0B6B57] font-num">
              {formatMoney(terms.amount, terms.currency)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
            <span className="text-[11px] text-[#12171F]/60 block font-medium">Delivery SLA</span>
            <span className="text-sm font-bold text-[#12171F] font-num">
              {terms.deliveryDays != null ? `${terms.deliveryDays} days` : '-'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
            <span className="text-[11px] text-[#12171F]/60 block font-medium">Currency</span>
            <span className="text-sm font-bold text-[#12171F] font-num">
              {terms.currency || 'USD'}
            </span>
          </div>

          {terms.quantity != null && (
            <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
              <span className="text-[11px] text-[#12171F]/60 block font-medium">Quantity</span>
              <span className="text-sm font-bold text-[#12171F] font-num">
                {terms.quantity} units
              </span>
            </div>
          )}

          {terms.product && (
            <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
              <span className="text-[11px] text-[#12171F]/60 block font-medium">Product</span>
              <span className="text-sm font-bold text-[#12171F] truncate block" title={terms.product}>
                {terms.product}
              </span>
            </div>
          )}

          {terms.sellerName && (
            <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5">
              <span className="text-[11px] text-[#12171F]/60 block font-medium">Seller</span>
              <span className="text-sm font-bold text-[#12171F] truncate block" title={terms.sellerName}>
                {terms.sellerName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Policy Checks List (if returned by server) */}
      {checks.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#12171F]/60 mb-2.5">
            Policy Rule Verification ({checks.filter((c) => c.passed).length}/{checks.length} Passed)
          </h4>
          <div className="space-y-2">
            {checks.map((c, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                  c.passed
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                    : 'bg-rose-50/60 border-rose-200 text-rose-950'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                    c.passed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {c.passed ? '✓' : '✗'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold">
                      {formatRuleName(c.rule)}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        c.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.passed ? 'Pass' : 'Fail'}
                    </span>
                  </div>

                  <p className="text-xs mt-1 text-[#12171F]/80 leading-relaxed">
                    {c.message || (c.passed ? 'Constraint verified successfully.' : 'Constraint check failed.')}
                  </p>

                  {(c.expected !== undefined || c.actual !== undefined) && (
                    <div className="mt-1 text-[11px] font-num text-[#12171F]/60 flex flex-wrap gap-x-3">
                      {c.expected !== undefined && <span>Expected: {String(c.expected)}</span>}
                      {c.actual !== undefined && <span>Actual: {String(c.actual)}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot SHA-256 Hash Display if present */}
      {agreement.snapshot?.hash && (
        <div className="p-3 rounded-xl bg-[#0D1F1A] text-white border border-[#0B6B57]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#6EE0BE] font-bold">🔒 Sealed Snapshot Hash:</span>
            <code className="font-num text-xs text-white/90 break-all">
              {agreement.snapshot.hash}
            </code>
          </div>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#6EE0BE]/20 text-[#6EE0BE] shrink-0">
            SHA-256 Intact
          </span>
        </div>
      )}
    </div>
  )
}

