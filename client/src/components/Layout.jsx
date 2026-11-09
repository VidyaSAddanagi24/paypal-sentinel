import React from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F1] text-[#12171F] font-sans">
      {/* Top Header */}
      <header className="bg-[#0D1F1A] text-white border-b border-[#0D1F1A]/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-[#0B6B57] flex items-center justify-center text-[#6EE0BE] font-bold shadow-md shadow-black/20 group-hover:bg-[#0B6B57]/90 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white block leading-none">
                PayPal <span className="text-[#6EE0BE]">Sentinel</span>
              </span>
              <span className="text-[11px] font-medium text-[#6EE0BE]/80 tracking-wide uppercase">
                Autonomous Procurement Guard
              </span>
            </div>
          </Link>

          {/* Nav Actions */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center"
                >
                  Dashboard
                </Link>
                <Link
                  to="/audit"
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center"
                >
                  Audit Trail
                </Link>
                <Link
                  to="/negotiations/new"
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#6EE0BE] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Negotiation</span>
                </Link>
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
                  <span className="text-xs text-white/70">
                    Signed in as <strong className="text-white font-medium">{user.name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-rose-500/20 border border-white/15 hover:border-rose-400/40 transition-colors flex items-center cursor-pointer"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-bold bg-[#6EE0BE] text-[#0D1F1A] hover:bg-[#6EE0BE]/90 transition-all shadow-md shadow-[#6EE0BE]/10 flex items-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0D1F1A] text-white/70 border-t border-[#0D1F1A]/70 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6EE0BE]" />
            <span className="font-semibold text-white">PayPal Sentinel</span>
            <span>&mdash; Autonomous Agent Negotiation &amp; Cryptographic Execution</span>
          </div>

          <div className="text-center md:text-right text-white/60">
            <span className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-[#6EE0BE]/90">
              Simulated seller disclosure: Seller agents operate in simulation sandbox mode.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
