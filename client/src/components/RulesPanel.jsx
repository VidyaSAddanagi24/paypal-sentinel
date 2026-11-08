import React from 'react'
import { formatMoney } from '../lib/format'

export default function RulesPanel({ rules, sellerProfile }) {
  if (!rules) return null

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#12171F]/10 shadow-sm space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#0B6B57]" />
          <h2 className="text-base sm:text-lg font-bold text-[#12171F]">
            Buyer Procurement Rules
          </h2>
        </div>
        <p className="text-xs text-[#12171F]/60">
          Immutable parameters establishing the guardrails for this negotiation.
        </p>
      </div>

      {/* Mandatory Note */}
      <div className="p-3.5 rounded-2xl bg-[#0B6B57]/10 border border-[#0B6B57]/20 text-[#0B6B57]">
        <div className="flex items-start gap-2.5">
          <svg
            className="w-4 h-4 text-[#0B6B57] shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div className="text-xs">
            <strong className="font-bold block text-[#0D1F1A]">
              Enforced by backend code, not by the AI
            </strong>
            <p className="text-[#0D1F1A]/75 mt-0.5 leading-relaxed">
              Every offer is deterministically verified against your rules before any agreement can be approved.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 text-xs">
          <span className="text-[#12171F]/60 font-medium">Product</span>
          <span className="font-bold text-[#12171F] truncate max-w-[180px]" title={rules.product}>
            {rules.product || 'Unspecified'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 text-xs">
          <span className="text-[#12171F]/60 font-medium">Quantity</span>
          <span className="font-bold text-[#12171F] font-num">
            {rules.quantity != null ? `${rules.quantity} units` : '-'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 text-xs">
          <span className="text-[#12171F]/60 font-medium">Maximum Budget</span>
          <span className="font-bold text-[#0B6B57] font-num text-sm">
            {formatMoney(rules.maxBudget, rules.currency)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 text-xs">
          <span className="text-[#12171F]/60 font-medium">Currency</span>
          <span className="font-bold text-[#12171F] font-num">
            {rules.currency || 'USD'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 text-xs">
          <span className="text-[#12171F]/60 font-medium">Max Delivery SLA</span>
          <span className="font-bold text-[#12171F] font-num">
            {rules.maxDeliveryDays != null ? `${rules.maxDeliveryDays} days` : '-'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 text-xs">
          <span className="text-[#12171F]/60 font-medium">Human Sign-off</span>
          <span className="font-bold text-[#0B6B57]">
            {rules.requiresApproval !== false ? 'Required' : 'Optional'}
          </span>
        </div>
      </div>

      {/* Seller Profile Summary (Public fields only - NEVER show or request minPrice) */}
      {sellerProfile && (
        <div className="pt-4 border-t border-[#12171F]/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#12171F]/60">
              Counterparty Profile
            </span>
            {sellerProfile.simulated && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Simulated
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#12171F]/60">Vendor</span>
              <span className="font-semibold text-[#12171F]">{sellerProfile.name || 'Simulated Vendor'}</span>
            </div>

            {sellerProfile.listPrice != null && (
              <div className="flex justify-between items-center">
                <span className="text-[#12171F]/60">Initial List Price</span>
                <span className="font-num font-semibold text-[#12171F]">
                  {formatMoney(sellerProfile.listPrice, sellerProfile.currency || rules.currency)}
                </span>
              </div>
            )}

            {sellerProfile.deliveryDays != null && (
              <div className="flex justify-between items-center">
                <span className="text-[#12171F]/60">Standard Delivery</span>
                <span className="font-num font-semibold text-[#12171F]">{sellerProfile.deliveryDays} days</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

