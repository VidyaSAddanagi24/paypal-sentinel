import React, { useState } from 'react'
import { login, register } from '../services/api'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [isRegister, setIsRegister] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e?.preventDefault()
        setError(null)
        setLoading(true)
        try {
            if (isRegister) {
                await register(name, email, password)
            } else {
                await login(email, password)
            }
            onAuthSuccess()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDemoLogin = async () => {
        setError(null)
        setLoading(true)
        try {
            // Attempt login with pre-created demo user or register if doesn't exist
            const demoEmail = 'procurement.director@paypal-sentinel.demo'
            const demoPass = 'SentinelSecure2026!'
            try {
                await login(demoEmail, demoPass)
            } catch {
                await register('Enterprise Procurement Lead', demoEmail, demoPass)
            }
            onAuthSuccess()
            onClose()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
                >
                    ✕
                </button>

                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                        {isRegister ? 'Create Sentinel Account' : 'Sign in to Sentinel'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Secure AI agent procurement with cryptographic policy enforcement
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Alice Chen"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="buyer@company.com"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-2 text-slate-500">Or instant demo</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition-all flex items-center justify-center space-x-2"
                >
                    <span>⚡ 1-Click Demo Login (Enterprise Buyer)</span>
                </button>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister)
                            setError(null)
                        }}
                        className="text-xs text-slate-400 hover:text-emerald-400"
                    >
                        {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    )
}

