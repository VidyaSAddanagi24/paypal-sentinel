import React from 'react'
import { SEVERITY_STYLES, getAuditLabel } from '../lib/auditLabels'
import AuditEventCard from './AuditEventCard'

/**
 * Vertical timeline of AuditEventCard, oldest first.
 * Blocked and warning events are visually prominent with a larger dot and ring.
 */
export default function AuditTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="py-10 px-4 text-center rounded-2xl bg-[#12171F]/5 border border-[#12171F]/10">
        <p className="text-sm text-[#12171F]/60 font-semibold">No audit events recorded yet.</p>
        <p className="text-xs text-[#12171F]/40 mt-1">Events appear here as the negotiation progresses.</p>
      </div>
    )
  }

  // Oldest first
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  return (
    <ol className="relative space-y-0" aria-label="Audit event timeline">
      {sorted.map((event, idx) => {
        const { severity } = getAuditLabel(event.type)
        const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
        const isBlocked = severity === 'blocked'
        const isWarning = severity === 'warning'
        const isLast = idx === sorted.length - 1

        return (
          <li key={event._id || idx} className="relative pl-10 pb-6 last:pb-0">
            {/* Vertical connector line (not for last item) */}
            {!isLast && (
              <span
                className="absolute left-[13px] top-[26px] bottom-0 w-0.5 bg-[#12171F]/10"
                aria-hidden="true"
              />
            )}

            {/* Timeline dot */}
            <span
              className={`absolute left-0 top-3 w-6 h-6 rounded-full ring-4 flex items-center justify-center ${styles.timelineDot} ring-white shadow-sm`}
              aria-hidden="true"
            >
              {/* Inner icon for blocked/warning */}
              {isBlocked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {isWarning && !isBlocked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                </svg>
              )}
              {!isBlocked && !isWarning && (
                <span className="w-2 h-2 rounded-full bg-white/80" />
              )}
            </span>

            <AuditEventCard event={event} />
          </li>
        )
      })}
    </ol>
  )
}

