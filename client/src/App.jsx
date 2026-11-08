import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import RulesForm from './components/RulesForm'
import NegotiationArena from './components/NegotiationArena'
import HistoryView from './components/HistoryView'
import AuditLogView from './components/AuditLogView'
import { getStoredUser, clearSession, getMe } from './services/api'

export default function App() {
    const [user, setUser] = useState(getStoredUser())
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('workspace')
    const [currentNegotiationId, setCurrentNegotiationId] = useState(null)

    // Verify token validity on load
    useEffect(() => {
        if (user) {
            getMe()
                .then((res) => setUser(res.user))
                .catch(() => {
                    clearSession()
                    setUser(null)
                })
        }
    }, [])

    const handleLogout = () => {
        clearSession()
        setUser(null)
    }

    const handleAuthSuccess = () => {
        setUser(getStoredUser())
    }

    const handleCreatedNegotiation = (negotiation) => {
        setCurrentNegotiationId(negotiation._id)
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
            {/* Top Navigation */}
            <Navbar
                user={user}
                onLogout={handleLogout}
                onOpenAuth={() => setIsAuthOpen(true)}
                activeTab={activeTab}
                setActiveTab={(tab) => {
                    setActiveTab(tab)
                }}
            />

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Intro Banner if not logged in */}
                {!user && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🛡️</span>
                            <div>
                                <h3 className="text-sm font-bold text-white">Welcome to PayPal Sentinel</h3>
                                <p className="text-xs text-slate-300">
                                    Autonomous procurement agents protected by deterministic policy enforcement and cryptographic drift detection.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 shrink-0"
                        >
                            ⚡ 1-Click Demo Login
                        </button>
                    </div>
                )}

                {/* Tab Views */}
                {activeTab === 'workspace' && (
                    <div>
                        {currentNegotiationId ? (
                            <NegotiationArena
                                negotiationId={currentNegotiationId}
                                onBack={() => setCurrentNegotiationId(null)}
                            />
                        ) : (
                            <div className="space-y-6">
                                <RulesForm
                                    onCreated={handleCreatedNegotiation}
                                    onRequireAuth={() => setIsAuthOpen(true)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <HistoryView
                        onSelectNegotiation={(id) => {
                            setCurrentNegotiationId(id)
                            setActiveTab('workspace')
                        }}
                        onNewNegotiation={() => {
                            setCurrentNegotiationId(null)
                            setActiveTab('workspace')
                        }}
                    />
                )}

                {activeTab === 'audit' && (
                    <AuditLogView
                        onSelectNegotiation={(id) => {
                            setCurrentNegotiationId(id)
                            setActiveTab('workspace')
                        }}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>PayPal Sentinel Security Engine v1.0 • Gemini 3.8 Flash • Deterministic Policy</span>
                    </div>
                    <span>Zero Agent Hallucination Policy • SHA-256 Snapshot Proof</span>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={handleAuthSuccess}
            />
        </div>
    )
}
