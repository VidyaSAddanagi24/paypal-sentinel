import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import AuditTimeline from '../components/AuditTimeline'
import { EVENT_CATEGORIES, getAuditLabel } from '../lib/auditLabels'
import { formatDate } from '../lib/format'

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'BLOCKED', label: 'Blocked' },
  { key: 'PAYMENTS', label: 'Payments' },
  { key: 'APPROVALS', label: 'Approvals' },
  { key: 'NEGOTIATION', label: 'Negotiation' },
]

function matchesFilter(event, filterKey) {
  if (filterKey === 'ALL') return true
  const types = EVENT_CATEGORIES[filterKey] || []
  return types.includes(event.type)
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 flex flex-col gap-1 ${accent}`}>
      <span className="text-2xl font-extrabold font-num leading-none">{value}</span>
      <span className="text-xs font-semibold text-[#12171F]/70 uppercase tracking-wide">{label}</span>
    </div>
  )
}

export default function AuditTrail() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError(null)
    api.get('/api/negotiations/audit/all')
      .then((res) => { if (!ignore) setEvents(res.events || []) })
      .catch((err) => { if (!ignore) setError(err.message || 'Failed to load audit trail') })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  const filtered = events.filter((e) => matchesFilter(e, filter))

  // Summary counts
  const totalEvents = events.length
  const blockedCount = events.filter((e) =>
    EVENT_CATEGORIES.BLOCKED.includes(e.type)
  ).length
  const paymentCount = events.filter((e) =>
    e.type === 'PAYMENT_CAPTURED'
  ).length

  // Group by negotiationId for display: show negotiationId as a label/link above each event
  // The timeline itself just renders cards; we wrap them per negotiationId group
  const groupedByNeg = filtered.reduce((acc, ev) => {
    const nid = ev.negotiationId ? String(ev.negotiationId) : '__none__'
    if (!acc[nid]) acc[nid] = []
    acc[nid].push(ev)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#0B6B57] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#12171F]">Loading audit trail...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#12171F] mb-1">Failed to Load Audit Trail</h2>
        <p className="text-sm text-rose-700 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page heading */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B6B57] hover:underline min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12171F] tracking-tight">
          Audit Trail
        </h1>
        <p className="text-sm text-[#12171F]/60">
          Every guardrail check, approval, and payment event across all your negotiations.
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <SummaryCard
          label="Total Events"
          value={totalEvents}
          accent="bg-sky-50 border-sky-200 text-sky-800"
        />
        <SummaryCard
          label="Blocked Attempts"
          value={blockedCount}
          accent="bg-rose-50 border-rose-200 text-rose-800"
        />
        <SummaryCard
          label="Successful Payments"
          value={paymentCount}
          accent="bg-emerald-50 border-emerald-200 text-emerald-800"
        />
      </div>

      {/* Filter chips */}
      <div
        role="group"
        aria-label="Filter events by category"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={isActive}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0B6B57] text-white border-[#0B6B57] shadow-sm'
                  : 'bg-white text-[#12171F]/70 border-[#12171F]/15 hover:border-[#0B6B57]/40 hover:text-[#0B6B57]'
              }`}
            >
              {f.label}
              {f.key !== 'ALL' && (
                <span className={`ml-1.5 font-num ${isActive ? 'text-white/80' : 'text-[#12171F]/40'}`}>
                  ({events.filter((e) => matchesFilter(e, f.key)).length})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Events list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#12171F]/5 border border-[#12171F]/10">
          <p className="text-sm font-semibold text-[#12171F]/60">
            {events.length === 0
              ? 'No audit events yet. Start a negotiation to see events here.'
              : `No events match the "${FILTERS.find((f) => f.key === filter)?.label}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedByNeg).map(([nid, negEvents]) => (
            <section key={nid}>
              {nid !== '__none__' && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-[#12171F]/50 uppercase tracking-wider">
                    Negotiation
                  </span>
                  <Link
                    to={`/negotiations/${nid}/audit`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#0B6B57] hover:underline min-h-[36px] px-2 py-1 rounded-lg bg-[#0B6B57]/5 hover:bg-[#0B6B57]/10 transition-colors"
                    title={`View full audit for negotiation ${nid}`}
                  >
                    {nid.slice(0, 8)}...{nid.slice(-6)}
                    <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    to={`/negotiations/${nid}/audit`}
                    className="text-xs font-semibold text-[#0B6B57] hover:underline min-h-[36px] flex items-center"
                  >
                    View full audit trail
                  </Link>
                </div>
              )}
              <AuditTimeline events={negEvents} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

