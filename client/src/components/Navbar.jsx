import React from 'react'

export default function Navbar({ user, onLogout, onOpenAuth, activeTab, setActiveTab }) {
    return (
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand & Sentinel Badge */}
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('workspace')}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20">
                        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                PayPal <span className="text-emerald-400">Sentinel</span>
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Autonomous Guard
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 hidden sm:block">Deterministic Policy Enforcement & Drift-Proof Payments</p>
                    </div>
                </div>

                {/* Tabs */}
                <nav className="flex items-center space-x-1 sm:space-x-2">
                    <button
                        onClick={() => setActiveTab('workspace')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            activeTab === 'workspace'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        Negotiation Arena
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            activeTab === 'history'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        History & Deals
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            activeTab === 'audit'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                    >
                        Security Audit Log
                    </button>
                </nav>

                {/* User / Auth */}
                <div className="flex items-center space-x-3">
                    {user ? (
                        <div className="flex items-center space-x-3">
                            <div className="hidden md:flex flex-col text-right">
                                <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]">{user.email}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <button
                                onClick={onLogout}
                                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded border border-slate-800 hover:border-rose-900 transition-colors"
                                title="Sign out"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="text-xs sm:text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-lg transition-colors font-semibold shadow-md shadow-emerald-500/10"
                        >
                            Sign In / Demo
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}

