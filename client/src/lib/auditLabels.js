/**
 * Maps every audit event type the server logs to a human-readable label,
 * a plain-language explanation, a text marker, and a severity level.
 *
 * severity: 'info' | 'success' | 'warning' | 'blocked'
 */

export const AUDIT_LABELS = {
  NEGOTIATION_CREATED: {
    label: 'Negotiation Created',
    explanation: 'A new negotiation was created with your instructions and financial rules.',
    marker: 'NEW',
    severity: 'info',
  },
  NEGOTIATION_STARTED: {
    label: 'Negotiation Started',
    explanation: 'The AI buyer agent has begun bargaining with the simulated seller agent.',
    marker: 'START',
    severity: 'info',
  },
  NEGOTIATION_FAILED: {
    label: 'Negotiation Failed',
    explanation: 'The agents were unable to reach an agreement within the allowed number of rounds.',
    marker: 'FAIL',
    severity: 'warning',
  },
  NEGOTIATION_ERROR: {
    label: 'Negotiation Error',
    explanation: 'An unexpected error occurred during the negotiation and it was halted.',
    marker: 'ERR',
    severity: 'warning',
  },
  NEGOTIATION_INTERRUPTED: {
    label: 'Negotiation Interrupted',
    explanation: 'The negotiation was interrupted before it could complete.',
    marker: 'STOP',
    severity: 'warning',
  },
  POLICY_PASSED: {
    label: 'Policy Passed',
    explanation: 'The agreed terms passed all deterministic policy checks and are within your financial rules.',
    marker: 'PASS',
    severity: 'success',
  },
  POLICY_BLOCKED: {
    label: 'Policy Blocked',
    explanation: 'The proposed terms violated one or more of your policy constraints and were rejected.',
    marker: 'BLOCK',
    severity: 'blocked',
  },
  APPROVAL_BLOCKED: {
    label: 'Approval Blocked',
    explanation: 'At the moment of approval the terms no longer passed policy checks and were rejected.',
    marker: 'BLOCK',
    severity: 'blocked',
  },
  APPROVED_BY_BUYER: {
    label: 'Approved by Buyer',
    explanation: 'You explicitly approved the exact snapshot terms and a single-use authorization was issued.',
    marker: 'APPR',
    severity: 'success',
  },
  PAYPAL_ORDER_CREATED: {
    label: 'PayPal Order Created',
    explanation: 'A PayPal order was created from the approved snapshot. The buyer must complete checkout in PayPal.',
    marker: 'PAY',
    severity: 'info',
  },
  PAYMENT_CAPTURED: {
    label: 'Payment Captured',
    explanation: 'The payment was successfully captured by PayPal after all integrity checks passed.',
    marker: 'DONE',
    severity: 'success',
  },
  PAYMENT_NOT_COMPLETED: {
    label: 'Payment Not Completed',
    explanation: 'PayPal returned a non-COMPLETED capture status. The payment may need manual review.',
    marker: 'WARN',
    severity: 'warning',
  },
  DRIFT_BLOCKED: {
    label: 'Drift Blocked',
    explanation: 'The Integrity Shield detected that the agreement terms changed after approval and blocked the payment.',
    marker: 'DRIFT',
    severity: 'blocked',
  },
  AUTHORIZATION_EXPIRED: {
    label: 'Authorization Expired',
    explanation: 'The single-use authorization window expired before the payment was completed. A fresh approval is required.',
    marker: 'EXP',
    severity: 'blocked',
  },
  DUPLICATE_CAPTURE_BLOCKED: {
    label: 'Duplicate Capture Blocked',
    explanation: 'A second capture attempt was detected and blocked. The authorization can only be used once.',
    marker: 'DUP',
    severity: 'blocked',
  },
  DEMO_TAMPER_APPLIED: {
    label: 'Demo Tamper Applied',
    explanation: 'A demonstration tamper was applied to the agreement amount to show the Integrity Shield in action.',
    marker: 'DEMO',
    severity: 'warning',
  },
  PAYPAL_ORDER_FAILED: {
    label: 'PayPal Order Failed',
    explanation: 'The attempt to create a PayPal order failed due to a PayPal API error.',
    marker: 'ERR',
    severity: 'warning',
  },
  PAYPAL_CAPTURE_FAILED: {
    label: 'PayPal Capture Failed',
    explanation: 'The PayPal capture call failed. The authorization has been revoked and a fresh approval is required.',
    marker: 'ERR',
    severity: 'warning',
  },
}

/** Severity → Tailwind colour tokens (bg, text, border, dot) */
export const SEVERITY_STYLES = {
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-400',
    markerBg: 'bg-sky-100',
    markerText: 'text-sky-700',
    timelineDot: 'bg-sky-400 ring-sky-200',
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    markerBg: 'bg-emerald-100',
    markerText: 'text-emerald-700',
    timelineDot: 'bg-emerald-500 ring-emerald-200',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    markerBg: 'bg-amber-100',
    markerText: 'text-amber-700',
    timelineDot: 'bg-amber-400 ring-amber-200',
  },
  blocked: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    markerBg: 'bg-rose-100',
    markerText: 'text-rose-700',
    timelineDot: 'bg-rose-500 ring-rose-200',
  },
}

/**
 * Returns the label config for the given event type,
 * falling back to the raw type name if unrecognised.
 */
export function getAuditLabel(type) {
  if (type && AUDIT_LABELS[type]) return AUDIT_LABELS[type]
  const raw = type ? String(type) : 'UNKNOWN'
  return {
    label: raw.replace(/_/g, ' '),
    explanation: 'An event of this type was recorded.',
    marker: raw.slice(0, 4),
    severity: 'info',
  }
}

/** Category tags used by the filter chips on /audit */
export const EVENT_CATEGORIES = {
  BLOCKED: [
    'POLICY_BLOCKED',
    'APPROVAL_BLOCKED',
    'DRIFT_BLOCKED',
    'AUTHORIZATION_EXPIRED',
    'DUPLICATE_CAPTURE_BLOCKED',
  ],
  PAYMENTS: [
    'PAYPAL_ORDER_CREATED',
    'PAYMENT_CAPTURED',
    'PAYMENT_NOT_COMPLETED',
    'PAYPAL_ORDER_FAILED',
    'PAYPAL_CAPTURE_FAILED',
  ],
  APPROVALS: [
    'APPROVED_BY_BUYER',
    'APPROVAL_BLOCKED',
  ],
  NEGOTIATION: [
    'NEGOTIATION_CREATED',
    'NEGOTIATION_STARTED',
    'NEGOTIATION_FAILED',
    'NEGOTIATION_ERROR',
    'NEGOTIATION_INTERRUPTED',
    'POLICY_PASSED',
    'POLICY_BLOCKED',
  ],
}

