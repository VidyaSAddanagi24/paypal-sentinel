import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Welcome Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#12171F]/10 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#12171F]/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B6B57]/10 text-[#0B6B57] text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-[#0B6B57]" />
              Sentinel Session Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12171F] tracking-tight">
              Welcome back, {user?.name || 'Buyer'}
            </h1>
            <p className="text-sm text-[#12171F]/70 mt-1 font-mono-numbers">
              {user?.email} &bull; User ID: <span className="font-num text-xs">{user?.id}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-[#12171F] bg-[#F4F5F1] hover:bg-rose-50 hover:text-rose-700 border border-[#12171F]/10 hover:border-rose-300 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Foundation Status & Placeholders */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#12171F] mb-4">Foundation Workspace (Placeholder)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#F4F5F1] border border-[#12171F]/10">
              <div className="w-8 h-8 rounded-lg bg-[#0B6B57]/10 text-[#0B6B57] flex items-center justify-center font-bold text-xs mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-[#12171F] mb-1">Negotiation Arena</h3>
              <p className="text-xs text-[#12171F]/70">
                Agent-to-agent bargaining stream and natural language intent parsing.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F4F5F1] border border-[#12171F]/10">
              <div className="w-8 h-8 rounded-lg bg-[#0B6B57]/10 text-[#0B6B57] flex items-center justify-center font-bold text-xs mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-[#12171F] mb-1">Policy Engine</h3>
              <p className="text-xs text-[#12171F]/70">
                Deterministic price, delivery SLA, quantity, and currency validation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F4F5F1] border border-[#12171F]/10">
              <div className="w-8 h-8 rounded-lg bg-[#0B6B57]/10 text-[#0B6B57] flex items-center justify-center font-bold text-xs mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-[#12171F] mb-1">PayPal Integrity Shield</h3>
              <p className="text-xs text-[#12171F]/70">
                Cryptographic snapshot lock &amp; tamper-proof execution via Orders v2.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

