import React, { useState, useEffect } from 'react'
import { listAuditEvents } from '../services/api'

export default function AuditLogView({ onSelectNegotiation }) {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expandedIdx, setExpandedIdx] = useState(null)

    const fetchEvents = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await listAuditEvents()
            setEvents(res.events || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [])

    const getBadge = (type) => {
        if (type.includes('BLOCKED') || type.includes('ERROR')) {
            return 'bg-red-500/20 text-red-400 border-red-500/40'
        }
        if (type.includes('APPROVED') || type.includes('PASSED') || type.includes('CAPTURED')) {
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }
        if (type.includes('PAYPAL')) {
            return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
        }
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span>🛡️ Sentinel Security Audit Trail</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Append-Only Ledger
                        </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                        Cryptographically referenced, immutable log of all autonomous negotiation steps, policy evaluations, and payment gates.
                    </p>
                </div>
                <button
                    onClick={fetchEvents}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
                >
                    ↻ Refresh
                </button>
            </div>

            {error && (
                <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching security logs...
                </div>
            ) : events.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                    No audit records recorded yet. Run a negotiation to generate events.
                </div>
            ) : (
                <div className="space-y-2">
                    {events.map((ev, idx) => {
                        const isExpanded = expandedIdx === idx
                        return (
                            <div
                                key={ev._id || idx}
                                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs transition-colors hover:border-slate-700"
                            >
                                <div
                                    className="flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getBadge(ev.type)}`}>
                                            {ev.type}
                                        </span>
                                        {ev.negotiationId && (
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onSelectNegotiation(ev.negotiationId)
                                                }}
                                                className="text-slate-400 hover:text-emerald-400 font-mono text-[11px] underline underline-offset-2"
                                            >
                                                Deal #{String(ev.negotiationId).slice(-6)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-3 text-slate-500 text-[11px] font-mono">
                                        <span>{new Date(ev.createdAt).toLocaleString()}</span>
                                        <span>{isExpanded ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-slate-900">
                                        <div className="text-[10px] text-slate-500 mb-1 uppercase font-semibold">Event Payload Details:</div>
                                        <pre className="bg-slate-900 p-2.5 rounded-lg text-emerald-400/90 font-mono text-[11px] overflow-x-auto border border-slate-800">
                                            {JSON.stringify(ev.details || {}, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

