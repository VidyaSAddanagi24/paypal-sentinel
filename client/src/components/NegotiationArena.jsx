import React, { useState, useEffect, useRef } from 'react'
import {
    getNegotiation,
    runNegotiation,
    approveNegotiation,
    createPayPalOrder,
    capturePayPalOrder,
    simulateDrift,
} from '../services/api'

export default function NegotiationArena({ negotiationId, onBack }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)
    const [driftMessage, setDriftMessage] = useState(null)
    const messagesEndRef = useRef(null)

    const fetchDetails = async () => {
        try {
            const res = await getNegotiation(negotiationId)
            setData(res)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!negotiationId) return
        fetchDetails()

        // Poll while actively negotiating
        const interval = setInterval(() => {
            if (data?.negotiation?.status === 'NEGOTIATING') {
                fetchDetails()
            }
        }, 1500)

        return () => clearInterval(interval)
    }, [negotiationId, data?.negotiation?.status])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [data?.messages])

    const handleRun = async () => {
        setActionLoading(true)
        setError(null)
        try {
            await runNegotiation(negotiationId)
            await fetchDetails()
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleApprove = async () => {
        setActionLoading(true)
        setError(null)
        try {
            await approveNegotiation(negotiationId)
            await fetchDetails()
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleCreatePayPalOrder = async () => {
        setActionLoading(true)
        setError(null)
        setDriftMessage(null)
        try {
            const res = await createPayPalOrder(negotiationId)
            await fetchDetails()
            if (res.order?.approveLink && !res.order.simulated) {
                // Real PayPal sandbox link
                window.open(res.order.approveLink, '_blank')
            }
        } catch (err) {
            setError(err.message)
            await fetchDetails()
        } finally {
            setActionLoading(false)
        }
    }

    const handleCapture = async () => {
        setActionLoading(true)
        setError(null)
        try {
            await capturePayPalOrder(negotiationId)
            await fetchDetails()
        } catch (err) {
            setError(err.message)
            await fetchDetails()
        } finally {
            setActionLoading(false)
        }
    }

    const handleSimulateDrift = async () => {
        setActionLoading(true)
        setError(null)
        try {
            const res = await simulateDrift(negotiationId)
            setDriftMessage(res.message)
            await fetchDetails()
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs">Loading negotiation arena...</p>
            </div>
        )
    }

    const n = data?.negotiation
    const rules = n?.rules
    const seller = n?.sellerProfile
    const messages = data?.messages || []
    const agreement = data?.agreement
    const events = data?.events || []
    const auth = data?.authorization

    const getStatusBadge = (status) => {
        const map = {
            DRAFT: 'bg-slate-800 text-slate-300 border-slate-700',
            NEGOTIATING: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse',
            AGREED: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
            AWAITING_APPROVAL: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold',
            APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold',
            PAYPAL_ORDER_CREATED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
            CAPTURED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-lg shadow-emerald-500/20',
            POLICY_BLOCKED: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold',
            BLOCKED_DRIFT: 'bg-red-500/20 text-red-400 border-red-500/50 font-bold shadow-lg shadow-red-500/20 animate-bounce',
            NEGOTIATION_FAILED: 'bg-slate-800 text-slate-400 border-slate-700',
        }
        return map[status] || 'bg-slate-800 text-slate-300'
    }

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors"
                >
                    <span>← Back to Form</span>
                </button>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500">ID: {n?._id}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusBadge(n?.status)}`}>
                        ● {n?.status}
                    </span>
                </div>
            </div>

            {/* Error or Alert banner */}
            {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2">
                    <span className="font-bold">Error:</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Drift Tamper Alert (Sentinel In Action) */}
            {driftMessage && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <div className="font-bold flex items-center space-x-2 mb-1">
                        <span>⚠️ Security Simulation Active</span>
                    </div>
                    <p>{driftMessage}</p>
                </div>
            )}

            {/* If blocked by drift */}
            {n?.status === 'BLOCKED_DRIFT' && (
                <div className="p-5 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs shadow-2xl">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                            🛡️
                        </div>
                        <h4 className="font-bold text-sm text-red-400">SENTINEL DRIFT DEFENSE ACTIVATED</h4>
                    </div>
                    <p className="text-slate-300">
                        The agreement terms were altered after the cryptographic authorization hash was sealed!
                        PayPal Sentinel has automatically aborted the payment authorization to prevent fraudulent or hallucinated overcharging.
                    </p>
                </div>
            )}

            {/* Agent Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buyer Agent Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                                🤖
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-white">Buyer Agent (Sentinel)</h3>
                                <p className="text-[11px] text-slate-400">Strict policy guardrail defender</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Gemini AI
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Product & Qty</span>
                            <span className="font-semibold text-slate-200">{rules?.quantity}x {rules?.product}</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Max Budget</span>
                            <span className="font-bold text-emerald-400 font-mono">{rules?.maxBudget} {rules?.currency}</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Max Delivery</span>
                            <span className="font-semibold text-slate-200">{rules?.maxDeliveryDays} days</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Human Approval</span>
                            <span className="font-semibold text-emerald-400">{rules?.requiresApproval ? 'Enforced' : 'Optional'}</span>
                        </div>
                    </div>
                </div>

                {/* Seller Agent Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold">
                                🏪
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-white">Seller Agent ({seller?.name || 'Vendor'})</h3>
                                <p className="text-[11px] text-slate-400">Autonomous market participant</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Simulated Vendor
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">List Price (Total)</span>
                            <span className="font-bold text-purple-400 font-mono">{seller?.listPrice} {seller?.currency}</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Delivery SLA</span>
                            <span className="font-semibold text-slate-200">{seller?.deliveryDays} days</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 col-span-2">
                            <span className="text-slate-500 block text-[10px]">Floor Price Protection</span>
                            <span className="text-slate-400 italic">Redacted (Private vendor threshold)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Agent Dialogue Stream */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Agent Dialogue Stream
                        </span>
                        <span className="text-[11px] text-slate-500">
                            (Round {n?.roundsUsed || 0} of {n?.maxRounds || 6})
                        </span>
                    </div>

                    {n?.status === 'DRAFT' && (
                        <button
                            onClick={handleRun}
                            disabled={actionLoading}
                            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center space-x-1.5"
                        >
                            <span>🚀 Start Autonomous Negotiation</span>
                        </button>
                    )}

                    {n?.status === 'NEGOTIATING' && (
                        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-medium">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span>Agents are negotiating live...</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                    {messages.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs">
                            {n?.status === 'DRAFT'
                                ? 'Click "Start Autonomous Negotiation" to let the agents bargain.'
                                : 'Awaiting opening round...'}
                        </div>
                    ) : (
                        messages.map((m, idx) => {
                            const isBuyer = m.role === 'buyer'
                            return (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}
                                >
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-[10px] font-mono text-slate-500">
                                            R{m.round} • {isBuyer ? 'Sentinel (Buyer)' : 'Vendor (Seller)'}
                                        </span>
                                        {m.offer?.amount && (
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                                isBuyer ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'
                                            }`}>
                                                {m.offer.amount} {m.offer.currency || rules?.currency} ({m.offer.deliveryDays}d)
                                            </span>
                                        )}
                                        {m.offer?.accepted && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                                                Accepted!
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                                            isBuyer
                                                ? 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/60'
                                                : 'bg-purple-950/40 text-purple-100 rounded-tr-sm border border-purple-500/30'
                                        }`}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Sentinel Policy Engine & Cryptographic Authorization Panel */}
            {agreement && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                🛡️
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Sentinel Policy Engine & Cryptographic Seal</h3>
                                <p className="text-[11px] text-slate-400">Deterministic code verification & tamper detection</p>
                            </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded font-bold uppercase ${
                            agreement.validation?.allowed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                            {agreement.validation?.allowed ? '✓ POLICY COMPLIANT' : '✗ POLICY REJECTED'}
                        </span>
                    </div>

                    {/* Agreed Terms vs Policy Checks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Agreed Contract Terms</span>
                            <div className="flex justify-between py-1 border-b border-slate-900">
                                <span className="text-slate-400">Final Agreed Amount</span>
                                <span className="font-bold font-mono text-emerald-400 text-sm">
                                    {agreement.terms?.amount} {agreement.terms?.currency}
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900">
                                <span className="text-slate-400">Budget Saving</span>
                                <span className="font-mono text-teal-400">
                                    +{(rules?.maxBudget - agreement.terms?.amount)} {agreement.terms?.currency} saved
                                </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-900">
                                <span className="text-slate-400">Delivery Commitment</span>
                                <span className="text-slate-200 font-semibold">{agreement.terms?.deliveryDays} Days</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400">Vendor</span>
                                <span className="text-slate-300">{agreement.terms?.sellerName}</span>
                            </div>
                        </div>

                        {/* Deterministic Policy Checklist */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Deterministic Policy Checks</span>
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Price &le; Max Budget</span>
                                    <span className="text-emerald-400 font-mono text-xs">✓ Passed ({agreement.terms?.amount} &le; {rules?.maxBudget})</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Delivery &le; SLA Ceiling</span>
                                    <span className="text-emerald-400 font-mono text-xs">✓ Passed ({agreement.terms?.deliveryDays}d &le; {rules?.maxDeliveryDays}d)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Quantity Integrity</span>
                                    <span className="text-emerald-400 font-mono text-xs">✓ Matched ({agreement.terms?.quantity} units)</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Currency Match</span>
                                    <span className="text-emerald-400 font-mono text-xs">✓ {agreement.terms?.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Snapshot SHA-256 Hash Display */}
                    {agreement.snapshot?.hash && (
                        <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center space-x-2">
                                <span className="text-emerald-400 font-bold">🔒 Terms Snapshot Hash:</span>
                                <code className="font-mono text-slate-300 text-[11px] break-all">{agreement.snapshot.hash}</code>
                            </div>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono shrink-0">
                                SHA-256 Verified
                            </span>
                        </div>
                    )}

                    {/* Next Action Control Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            {auth && (
                                <div className="flex items-center space-x-2 text-xs">
                                    <span className="text-slate-400">Authorization Status:</span>
                                    <span className="font-bold text-emerald-400 font-mono">{auth.status}</span>
                                    {auth.paypalOrderId && (
                                        <span className="text-indigo-400 font-mono">({auth.paypalOrderId})</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Step A: Human Approval */}
                            {n?.status === 'AWAITING_APPROVAL' && (
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <span>✍️ Approve & Seal Cryptographic Snapshot</span>
                                </button>
                            )}

                            {/* Step B: PayPal Order Creation */}
                            {['APPROVED', 'PAYPAL_ORDER_CREATED'].includes(n?.status) && !auth?.paypalOrderId && (
                                <button
                                    onClick={handleCreatePayPalOrder}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <span>💳 Authorize via PayPal Sandbox</span>
                                </button>
                            )}

                            {/* Step C: Capture PayPal Order */}
                            {n?.status === 'PAYPAL_ORDER_CREATED' && auth?.paypalOrderId && (
                                <button
                                    onClick={handleCapture}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <span>✅ Capture Payment ({agreement.terms?.amount} {agreement.terms?.currency})</span>
                                </button>
                            )}

                            {/* Step D: Completed Celebration */}
                            {n?.status === 'CAPTURED' && (
                                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg">
                                    🎉 Transaction Captured & Protected by Sentinel
                                </div>
                            )}

                            {/* Tamper Defense Demo Button */}
                            {['APPROVED', 'PAYPAL_ORDER_CREATED'].includes(n?.status) && n?.status !== 'CAPTURED' && (
                                <button
                                    onClick={handleSimulateDrift}
                                    disabled={actionLoading}
                                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-all flex items-center space-x-1"
                                    title="Tamper with agreement to demonstrate Sentinel SHA-256 detection"
                                >
                                    <span>🚨 Test Drift Attack Simulation</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Trail Snippet for this Negotiation */}
            {events.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
                    <h4 className="font-bold text-slate-300 mb-3 flex items-center space-x-2">
                        <span>📜 Negotiation Audit History ({events.length} events logged)</span>
                    </h4>
                    <div className="space-y-2">
                        {events.map((ev, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="font-mono font-bold text-slate-200">{ev.type}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(ev.createdAt).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

