import React from 'react'

const PIPELINE_STEPS = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'NEGOTIATING', label: 'Negotiating' },
  { key: 'POLICY_CHECK', label: 'Policy check' },
  { key: 'AWAITING_APPROVAL', label: 'Awaiting approval' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PAYPAL_ORDER_CREATED', label: 'Order created' },
  { key: 'CAPTURED', label: 'Captured' },
]

const FAILED_CONFIG = {
  NEGOTIATION_FAILED: {
    failedIndex: 1, // failed during Negotiating
    title: 'Negotiation Failed',
    message: 'Agents could not agree on mutually acceptable terms within the maximum rounds.',
    color: 'rose',
  },
  POLICY_BLOCKED: {
    failedIndex: 2, // failed at Policy Check
    title: 'Policy Blocked',
    message: 'Proposed agreement violated one or more deterministic financial guardrail rules.',
    color: 'rose',
  },
  BLOCKED_DRIFT: {
    failedIndex: 5, // blocked before/during order creation
    title: 'Integrity Shield Blocked (Drift Detected)',
    message: 'Terms were altered after cryptographic snapshot authorization. Sentinel aborted the checkout to protect funds.',
    color: 'red',
  },
  EXPIRED: {
    failedIndex: 3, // expired at approval
    title: 'Authorization Expired',
    message: 'The authorization validity window for this agreement has lapsed.',
    color: 'stone',
  },
}

function getActiveStepIndex(status) {
  switch (status) {
    case 'DRAFT':
      return 0
    case 'NEGOTIATING':
      return 1
    case 'AGREED':
      return 2
    case 'AWAITING_APPROVAL':
      return 3
    case 'APPROVED':
      return 4
    case 'PAYPAL_ORDER_CREATED':
      return 5
    case 'CAPTURED':
      return 6
    default:
      return 0
  }
}

export default function ProgressSteps({ status }) {
  const isFailed = Boolean(FAILED_CONFIG[status])
  const failInfo = FAILED_CONFIG[status]
  const activeIndex = isFailed ? failInfo.failedIndex : getActiveStepIndex(status)

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#12171F]/10 shadow-sm space-y-4">
      {/* Step pipeline bar */}
      <div className="overflow-x-auto pb-2 -mb-2">
        <ol className="flex items-center min-w-[620px] justify-between">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = isFailed ? idx < activeIndex : (status === 'CAPTURED' ? true : idx < activeIndex)
            const isCurrent = !isFailed && idx === activeIndex
            const isFailedStep = isFailed && idx === activeIndex

            return (
              <li key={step.key} className="flex-1 relative flex flex-col items-center group">
                {/* Connecting Line between steps */}
                {idx > 0 && (
                  <div
                    aria-hidden="true"
                    className={`absolute top-4 -left-1/2 w-full h-0.5 -translate-y-1/2 z-0 ${
                      idx <= activeIndex
                        ? isFailedStep
                          ? 'bg-rose-300'
                          : 'bg-[#0B6B57]'
                        : 'bg-[#12171F]/10'
                    }`}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-all ${
                    isFailedStep
                      ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                      : isCurrent
                      ? 'bg-[#0B6B57] text-white ring-4 ring-[#0B6B57]/20 animate-pulse'
                      : isCompleted
                      ? 'bg-[#0B6B57] text-white'
                      : 'bg-[#F4F5F1] text-[#12171F]/40 border border-[#12171F]/15'
                  }`}
                >
                  {isFailedStep ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] font-semibold mt-2 text-center truncate max-w-[85px] ${
                    isFailedStep
                      ? 'text-rose-700 font-bold'
                      : isCurrent
                      ? 'text-[#0B6B57] font-bold'
                      : isCompleted
                      ? 'text-[#12171F]'
                      : 'text-[#12171F]/40'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Distinct Failed/Blocked Banner State */}
      {isFailed && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 animate-in fade-in"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-rose-900">
              {failInfo.title}
            </h4>
            <p className="text-xs text-rose-800/90 mt-0.5 leading-relaxed">
              {failInfo.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
