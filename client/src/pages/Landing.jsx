import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="w-full bg-[#F4F5F1]">
      {/* Hero Section */}
      <section className="bg-[#0D1F1A] text-white pt-16 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0B6B57]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#6EE0BE]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B6B57]/40 border border-[#6EE0BE]/30 text-[#6EE0BE] text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6EE0BE] animate-pulse" />
            Deterministic Procurement Sentinel
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Two AI agents negotiate.{' '}
            <span className="text-[#6EE0BE] block sm:inline">Humans authorize.</span>{' '}
            PayPal executes.
          </h1>

          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
            An autonomous procurement guardrail platform. Multi-agent negotiation governed by strict deterministic
            policy rules, SHA-256 snapshot sealing, and cryptographic tamper defense before payment execution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="w-full sm:w-auto min-h-[44px] px-8 py-3.5 rounded-xl font-bold text-base bg-[#6EE0BE] text-[#0D1F1A] hover:bg-[#6EE0BE]/90 transition-all shadow-lg shadow-[#6EE0BE]/20 flex items-center justify-center cursor-pointer"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </Link>
            {!user && (
              <Link
                to="/login"
                className="w-full sm:w-auto min-h-[44px] px-7 py-3.5 rounded-xl font-semibold text-base text-white/90 bg-white/10 hover:bg-white/15 border border-white/20 transition-all flex items-center justify-center cursor-pointer"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Simulated Seller disclosure pill */}
          <div className="mt-10 inline-block px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 max-w-xl">
            <strong className="text-[#6EE0BE]">Simulated Seller Disclosure:</strong> For demonstration and security testing,
            seller agents participate via simulated vendor profiles with hidden price floors.
          </div>
        </div>
      </section>

      {/* 4-Step How It Works Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0B6B57] bg-[#0B6B57]/10 px-3 py-1 rounded-full border border-[#0B6B57]/20">
            Workflow Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#12171F] tracking-tight mt-3 mb-4">
            How PayPal Sentinel Works
          </h2>
          <p className="text-sm sm:text-base text-[#12171F]/70">
            A zero-trust procurement loop where AI proposes terms, code checks rules, humans hold the key, and PayPal moves funds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#12171F]/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-num text-2xl font-bold text-[#0B6B57]">01</span>
                <span className="w-8 h-8 rounded-lg bg-[#0B6B57]/10 flex items-center justify-center text-[#0B6B57]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#12171F] mb-2">Agents negotiate</h3>
              <p className="text-sm text-[#12171F]/70 leading-relaxed">
                The buyer agent and seller agent exchange structured counteroffers to find an optimal price and delivery timeline.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#12171F]/5 text-[11px] font-medium text-[#0B6B57]">
              Multi-round agent dialogue
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-[#12171F]/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-num text-2xl font-bold text-[#0B6B57]">02</span>
                <span className="w-8 h-8 rounded-lg bg-[#0B6B57]/10 flex items-center justify-center text-[#0B6B57]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#12171F] mb-2">Policy engine decides</h3>
              <p className="text-sm text-[#12171F]/70 leading-relaxed">
                Deterministic code validates agreed terms against strict constraints: budget ceilings, delivery dates, and quantity.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#12171F]/5 text-[11px] font-medium text-[#0B6B57]">
              Zero-hallucination verification
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#12171F]/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-num text-2xl font-bold text-[#0B6B57]">03</span>
                <span className="w-8 h-8 rounded-lg bg-[#0B6B57]/10 flex items-center justify-center text-[#0B6B57]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#12171F] mb-2">You approve the exact deal</h3>
              <p className="text-sm text-[#12171F]/70 leading-relaxed">
                Terms freeze into an immutable SHA-256 snapshot. Human authorization is mandatory and valid for a 15-minute window.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#12171F]/5 text-[11px] font-medium text-[#0B6B57]">
              SHA-256 snapshot lock
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-[#12171F]/10 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-num text-2xl font-bold text-[#0B6B57]">04</span>
                <span className="w-8 h-8 rounded-lg bg-[#0B6B57]/10 flex items-center justify-center text-[#0B6B57]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#12171F] mb-2">PayPal executes</h3>
              <p className="text-sm text-[#12171F]/70 leading-relaxed">
                The Integrity Shield re-verifies the order against the snapshot. Any price drift aborts payment before money moves.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#12171F]/5 text-[11px] font-medium text-[#0B6B57]">
              Guarded PayPal checkout
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-16 bg-[#0D1F1A] text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Ready to test autonomous procurement?
          </h3>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-8">
            Create an account to configure your procurement constraints, run AI negotiations, and verify the cryptographic integrity shield.
          </p>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="inline-flex items-center justify-center min-h-[44px] px-8 py-3.5 rounded-xl font-bold text-base bg-[#6EE0BE] text-[#0D1F1A] hover:bg-[#6EE0BE]/90 transition-all shadow-md shadow-[#6EE0BE]/10 cursor-pointer"
          >
            {user ? 'Enter Dashboard' : 'Get Started Now'}
          </Link>
        </div>
      </section>
    </div>
  )
}

