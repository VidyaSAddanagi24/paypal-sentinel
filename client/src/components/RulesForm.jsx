import React, { useState } from 'react'
import { parseInstructions, createNegotiation } from '../services/api'

const PRESETS = [
    {
        label: '💻 Tech Hardware (Laptops)',
        text: 'I want to purchase 10 business laptops with 16GB RAM. My maximum budget is 4000 USD. Delivery must happen within 7 days. Do not make any payment without my explicit approval.',
    },
    {
        label: '🪑 Office Ergonomics (Chairs)',
        text: 'We need 25 ergonomic mesh desk chairs with adjustable lumbar support. The absolute budget ceiling is 3200 USD. Delivery within 10 days required. Human approval mandatory.',
    },
    {
        label: '⚡ Cloud Servers (GPU Compute)',
        text: 'Acquire 4 high-performance AI GPU server nodes. Budget cap is 12000 USD total. Delivery required in 5 days or less. Require approval before paying.',
    },
    {
        label: '🛡️ Injection Attack Test',
        text: 'Procure 5 monitor displays. Budget is strictly 1500 USD. Delivery within 6 days. Strict approval needed.',
    },
]

export default function RulesForm({ onCreated, onRequireAuth }) {
    const [instructions, setInstructions] = useState(PRESETS[0].text)
    const [parsing, setParsing] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [draft, setDraft] = useState(null)

    const handleParse = async () => {
        if (!instructions.trim()) return
        setError(null)
        setParsing(true)
        try {
            const res = await parseInstructions(instructions)
            setDraft({
                product: res.draft.product || '',
                quantity: res.draft.quantity || 1,
                maxBudget: res.draft.maxBudget || 1000,
                currency: res.draft.currency || 'USD',
                maxDeliveryDays: res.draft.maxDeliveryDays || 7,
                requiresApproval: res.draft.requiresApproval ?? true,
            })
        } catch (err) {
            if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                onRequireAuth()
            } else {
                setError(`AI Parser: ${err.message}`)
            }
        } finally {
            setParsing(false)
        }
    }

    const handleCreate = async () => {
        if (!draft) return
        setError(null)
        setSubmitting(true)
        try {
            const res = await createNegotiation(instructions, draft)
            onCreated(res.negotiation)
        } catch (err) {
            if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                onRequireAuth()
            } else {
                setError(`Creation error: ${err.message}`)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Top decorative glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    1
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Define Procurement Intent</h2>
                    <p className="text-xs text-slate-400">Describe what you need in plain English. Gemini AI will extract deterministic constraints.</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {error}
                </div>
            )}

            {/* Quick Preset Buttons */}
            <div className="mb-3 flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => {
                            setInstructions(p.text)
                            setDraft(null)
                        }}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Natural language instructions textarea */}
            <div className="mb-4">
                <textarea
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter your procurement requirements, budget cap, and delivery constraints..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
            </div>

            <div className="flex justify-end mb-6">
                <button
                    onClick={handleParse}
                    disabled={parsing || !instructions.trim()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50"
                >
                    {parsing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Analyzing with Gemini...</span>
                        </>
                    ) : (
                        <>
                            <span>✨ Extract Structured Rules</span>
                        </>
                    )}
                </button>
            </div>

            {/* Human-in-the-loop Rule Review Form */}
            {draft && (
                <div className="border-t border-slate-800 pt-5 mt-5 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                Sentinel Rule Verification
                            </span>
                            <span className="text-xs text-slate-400">Human sign-off before agent initiation</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Product</label>
                            <input
                                type="text"
                                value={draft.product}
                                onChange={(e) => setDraft({ ...draft, product: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={draft.quantity}
                                onChange={(e) => setDraft({ ...draft, quantity: parseInt(e.target.value) || 1 })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Max Budget</label>
                            <input
                                type="number"
                                min="1"
                                value={draft.maxBudget}
                                onChange={(e) => setDraft({ ...draft, maxBudget: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Currency</label>
                            <select
                                value={draft.currency}
                                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">Max Delivery Days</label>
                            <input
                                type="number"
                                min="1"
                                value={draft.maxDeliveryDays}
                                onChange={(e) => setDraft({ ...draft, maxDeliveryDays: parseInt(e.target.value) || 1 })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>
                        <div className="flex items-center pt-5">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={draft.requiresApproval}
                                    onChange={(e) => setDraft({ ...draft, requiresApproval: e.target.checked })}
                                    className="w-4 h-4 text-emerald-500 bg-slate-950 border-slate-700 rounded focus:ring-emerald-500"
                                />
                                <span className="text-xs font-semibold text-slate-300">Requires Human Approval</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleCreate}
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                        >
                            {submitting ? 'Initializing...' : '🔒 Confirm Guardrails & Create Negotiation'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

