import React, { useState, useRef } from 'react'
import { getAuditLabel, SEVERITY_STYLES } from '../lib/auditLabels'
import { formatDate } from '../lib/format'

/** Truncates a long hash/id string and shows full value on hover + copy button */
function HashDisplay({ value }) {
  const [copied, setCopied] = useState(false)
  const str = String(value ?? '')
  const isLong = str.length > 16
  const display = isLong ? str.slice(0, 8) + '...' + str.slice(-6) : str

  const handleCopy = () => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
      <span
        title={str}
        className="bg-[#12171F]/5 border border-[#12171F]/10 rounded px-1.5 py-0.5 cursor-default select-all"
      >
        {display}
      </span>
      {isLong && (
        <button
          type="button"
          onClick={handleCopy}
          title="Copy full value"
          aria-label="Copy full value"
          className="min-w-[28px] min-h-[28px] inline-flex items-center justify-center rounded hover:bg-[#12171F]/10 transition-colors text-[#12171F]/50 hover:text-[#12171F] cursor-pointer"
        >
          {copied ? (
            <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}
    </span>
  )
}

/** Renders event details as plain-text formatted JSON inside a <pre>. Never uses dangerouslySetInnerHTML. */
function DetailsBlock({ details }) {
  if (details === null || details === undefined) {
    return <p className="text-xs text-[#12171F]/50 italic">No details recorded.</p>
  }
  let text
  try {
    text = JSON.stringify(details, null, 2)
  } catch {
    text = String(details)
  }
  return (
    <pre className="text-[11px] leading-relaxed font-mono bg-[#12171F]/5 border border-[#12171F]/10 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
      {text}
    </pre>
  )
}

export default function AuditEventCard({ event }) {
  const [open, setOpen] = useState(false)
  const { type, details, createdAt, negotiationId } = event
  const { label, explanation, marker, severity } = getAuditLabel(type)
  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
  const isBlocked = severity === 'blocked'
  const isSuccess = severity === 'success'

  return (
    <article
      className={`rounded-2xl border p-4 sm:p-5 space-y-3 shadow-sm transition-all ${styles.bg} ${styles.border} ${isBlocked ? 'ring-1 ring-rose-300/60' : ''}`}
      aria-label={`Audit event: ${label}`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Severity badge: text + colour, never colour alone */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles.markerBg} ${styles.markerText} ${styles.border} shrink-0`}
            aria-label={`Severity: ${severity}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} shrink-0`} aria-hidden="true" />
            {severity.toUpperCase()}
          </span>

          {/* Event label */}
          <span className={`text-sm font-bold ${styles.text} leading-tight`}>{label}</span>

          {/* Marker tag */}
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${styles.markerBg} ${styles.markerText} ${styles.border} hidden sm:inline`}>
            {marker}
          </span>
        </div>

        {/* Timestamp */}
        <time
          dateTime={createdAt}
          className="text-xs text-[#12171F]/60 font-num shrink-0 whitespace-nowrap"
        >
          {formatDate(createdAt)}
        </time>
      </div>

      {/* Explanation */}
      <p className={`text-xs leading-relaxed ${styles.text} opacity-90`}>{explanation}</p>

      {/* Collapsible Details */}
      <div className="pt-1 border-t border-current/10">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${styles.text} hover:underline min-h-[36px] cursor-pointer transition-opacity`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {open ? 'Hide Details' : 'Show Details'}
        </button>

        {open && (
          <div className="mt-2 space-y-2">
            {/* Highlight long hash-looking values in details */}
            {details && typeof details === 'object' && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                {Object.entries(details)
                  .filter(([, v]) => typeof v === 'string' && v.length > 20)
                  .map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1.5 text-xs text-[#12171F]/70">
                      <span className="font-semibold capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <HashDisplay value={v} />
                    </span>
                  ))}
              </div>
            )}
            <DetailsBlock details={details} />
          </div>
        )}
      </div>
    </article>
  )
}

