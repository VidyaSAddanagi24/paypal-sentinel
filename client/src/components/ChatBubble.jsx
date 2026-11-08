import React from 'react'
import { formatMoney } from '../lib/format'

export default function ChatBubble({ message, sellerName = 'Vendor' }) {
  if (!message) return null

  const isBuyer = message.role === 'buyer'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium max-w-md text-center">
          {message.text}
        </div>
      </div>
    )
  }

  const roleLabel = isBuyer ? 'Buyer Agent (Sentinel)' : `Seller Agent (${sellerName})`
  const offer = message.offer

  return (
    <div className={`flex flex-col mb-4 ${isBuyer ? 'items-start' : 'items-end'}`}>
      {/* Header with role and round */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            isBuyer ? 'text-[#0B6B57]' : 'text-purple-700'
          }`}
        >
          {roleLabel}
        </span>
        <span className="text-[11px] text-[#12171F]/50 font-num">
          Round {message.round}
        </span>
      </div>

      {/* Bubble container */}
      <div
        className={`w-full max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm border transition-all ${
          isBuyer
            ? 'bg-white border-[#0B6B57]/20 rounded-tl-sm text-[#12171F]'
            : 'bg-purple-50/60 border-purple-200/80 rounded-tr-sm text-[#12171F]'
        }`}
      >
        {/* Untrusted message text: plain text only, never rendered as HTML */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans text-[#12171F]">
          {message.text}
        </p>

        {/* Offered price and delivery days in monospace */}
        {offer && (offer.amount != null || offer.deliveryDays != null || offer.accepted) && (
          <div
            className={`mt-3 pt-2.5 border-t flex flex-wrap items-center gap-2 text-xs font-num ${
              isBuyer ? 'border-[#0B6B57]/15' : 'border-purple-200'
            }`}
          >
            {offer.amount != null && (
              <span
                className={`font-bold px-2 py-0.5 rounded border ${
                  isBuyer
                    ? 'bg-[#0B6B57]/10 text-[#0B6B57] border-[#0B6B57]/20'
                    : 'bg-purple-100/80 text-purple-900 border-purple-300'
                }`}
              >
                Price: {formatMoney(offer.amount, offer.currency)}
              </span>
            )}

            {offer.deliveryDays != null && (
              <span className="bg-white/80 px-2 py-0.5 rounded border border-[#12171F]/10 text-[#12171F]/80">
                Delivery: {offer.deliveryDays} {offer.deliveryDays === 1 ? 'day' : 'days'}
              </span>
            )}

            {offer.quantity != null && (
              <span className="bg-white/80 px-2 py-0.5 rounded border border-[#12171F]/10 text-[#12171F]/80">
                Qty: {offer.quantity}
              </span>
            )}

            {offer.accepted && (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                Offer Accepted ✓
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

