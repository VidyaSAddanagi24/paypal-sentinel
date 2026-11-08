/**
 * Formats an amount using Intl.NumberFormat based on currency.
 * Server stores amounts in standard currency units (e.g. 4000 = $4,000, 400000 = ₹4,00,000).
 */
export function formatMoney(amount, currency = 'USD') {
  const num = typeof amount === 'number' ? amount : Number(amount)
  if (isNaN(num)) return '-'

  const curr = (currency || 'USD').toUpperCase()
  const locale = curr === 'INR' ? 'en-IN' : 'en-US'

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return `${curr} ${num.toLocaleString(locale)}`
  }
}

/**
 * Formats a date string or timestamp into a readable date string.
 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '-'

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d)
  } catch {
    return d.toLocaleDateString()
  }
}

/**
 * Status mapping for all Sentinel negotiation statuses.
 * Coloured pill styles: bg, text, border, and dot indicator.
 */
export const STATUS_MAP = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    category: 'active',
    description: 'Initial draft saved',
  },
  NEGOTIATING: {
    label: 'Negotiating',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500 animate-pulse',
    category: 'active',
    description: 'Agents actively exchanging offers',
  },
  AWAITING_APPROVAL: {
    label: 'Awaiting Approval',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-400',
    dot: 'bg-amber-600',
    category: 'active',
    description: 'Deal agreed, awaiting your authorization',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
    category: 'active',
    description: 'Cryptographic snapshot approved',
  },
  PAYPAL_ORDER_CREATED: {
    label: 'PayPal Order Created',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-300',
    dot: 'bg-sky-500',
    category: 'active',
    description: 'PayPal checkout initialized',
  },
  CAPTURED: {
    label: 'Captured',
    bg: 'bg-[#6EE0BE]/20',
    text: 'text-[#0B6B57]',
    border: 'border-[#0B6B57]/30',
    dot: 'bg-[#0B6B57]',
    category: 'completed',
    description: 'Payment securely captured',
  },
  POLICY_BLOCKED: {
    label: 'Policy Blocked',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
    category: 'blocked',
    description: 'Violated buyer policy constraints',
  },
  BLOCKED_DRIFT: {
    label: 'Blocked: Drift',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-600',
    category: 'blocked',
    description: 'Integrity shield detected price tampering',
  },
  NEGOTIATION_FAILED: {
    label: 'Negotiation Failed',
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-300',
    dot: 'bg-zinc-500',
    category: 'blocked',
    description: 'Agents could not agree on terms',
  },
  EXPIRED: {
    label: 'Expired',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
    dot: 'bg-stone-400',
    category: 'blocked',
    description: 'Authorization window expired',
  },
  AGREED: {
    label: 'Agreed',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
    dot: 'bg-teal-500',
    category: 'active',
    description: 'Terms agreed by agents',
  },
}

/**
 * Returns the status config, defaulting to a neutral pill if unknown.
 */
export function getStatusConfig(status) {
  if (status && STATUS_MAP[status]) {
    return STATUS_MAP[status]
  }
  return {
    label: status ? String(status).replace(/_/g, ' ') : 'Unknown',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
    category: 'unknown',
    description: 'Status unavailable',
  }
}

