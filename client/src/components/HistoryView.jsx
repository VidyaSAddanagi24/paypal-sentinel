import React, { useState, useEffect } from 'react'
import { listNegotiations } from '../services/api'

export default function HistoryView({ onSelectNegotiation, onNewNegotiation }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchList = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await listNegotiations()
            setItems(res.negotiations || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    const getStatusStyle = (status) => {
        switch (status) {
            case 'CAPTURED':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            case 'APPROVED':
                return 'bg-teal-500/10 text-teal-400 border-teal-500/30'
            case 'AWAITING_APPROVAL':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            case 'BLOCKED_DRIFT':
                return 'bg-red-500/20 text-red-400 border-red-500/50'
            case 'POLICY_BLOCKED':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            case 'NEGOTIATING':
                return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse'
            default:
                return 'bg-slate-800 text-slate-300 border-slate-700'
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold text-white">Negotiation Archives & Deals</h2>
                    <p className="text-xs text-slate-400">Review past agent bargains, cryptographic authorizations, and payment statuses.</p>
                </div>
                <button
                    onClick={onNewNegotiation}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/10"
                >
                    + New Procurement
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
                    Loading deals...
                </div>
            ) : items.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                    No negotiations found. Start one from the Negotiation Arena!
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-3">Product</th>
                                <th className="py-3 px-3">Budget</th>
                                <th className="py-3 px-3">Rounds</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3">Updated</th>
                                <th className="py-3 px-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {items.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="py-3 px-3 font-medium text-slate-200">
                                        {item.rules?.quantity}x {item.rules?.product}
                                    </td>
                                    <td className="py-3 px-3 font-mono font-semibold text-emerald-400">
                                        {item.rules?.maxBudget} {item.rules?.currency}
                                    </td>
                                    <td className="py-3 px-3 text-slate-400">
                                        {item.roundsUsed || 0} / {item.maxRounds || 6}
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                                        {new Date(item.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <button
                                            onClick={() => onSelectNegotiation(item._id)}
                                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors font-medium text-[11px]"
                                        >
                                            Inspect →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

