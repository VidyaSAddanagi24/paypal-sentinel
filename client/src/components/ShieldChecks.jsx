import React from 'react'

/**
 * The 11 Integrity Shield check rule names (from integrityShield.js).
 * Displayed in the order they appear in the shield.
 */
const SHIELD_RULE_LABELS = {
  agreement_approved:       'Agreement Approved',
  snapshot_intact:          'Snapshot Intact',
  terms_unchanged:          'Terms Unchanged',
  authorization_matches:    'Authorization Matches',
  authorization_active:     'Authorization Active',
  authorization_unused:     'Authorization Unused',
  authorization_not_expired:'Authorization Not Expired',
  order_amount:             'Order Amount',
  order_currency:           'Order Currency',
  order_merchant:           'Order Merchant',
  order_agreement:          'Order Agreement',
}

/**
 * Renders the Integrity Shield check results.
 * Pass an array of check objects: { rule, passed, message }.
 * Omits entirely if checks is empty or null.
 */
export default function ShieldChecks({ checks }) {
  if (!Array.isArray(checks) || checks.length === 0) return null

  const passedCount = checks.filter((c) => c.passed).length

  return (
    <div className="rounded-2xl border border-[#0B6B57]/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D1F1A] text-white">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#6EE0BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm font-bold">Integrity Shield Checks</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
          passedCount === checks.length
            ? 'bg-emerald-900/40 text-[#6EE0BE] border-[#6EE0BE]/30'
            : 'bg-rose-900/40 text-rose-300 border-rose-500/30'
        }`}>
          {passedCount}/{checks.length} Passed
        </span>
      </div>

      <div className="divide-y divide-[#12171F]/8 bg-white">
        {checks.map((c, idx) => {
          const label = SHIELD_RULE_LABELS[c.rule] || String(c.rule).replace(/_/g, ' ')
          return (
            <div
              key={c.rule || idx}
              className={`flex items-start gap-3 px-4 py-3 ${
                c.passed ? 'bg-emerald-50/40' : 'bg-rose-50/60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
                  c.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {c.passed ? '✓' : '✗'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#12171F]">{label}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    c.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {c.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
                {c.message && (
                  <p className="text-xs mt-0.5 text-[#12171F]/70 leading-relaxed">{c.message}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

