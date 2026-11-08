import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatMoney, formatDate } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import SummaryCard from '../components/SummaryCard'

const ACTIVE_STATUSES = ['DRAFT', 'NEGOTIATING', 'AWAITING_APPROVAL', 'APPROVED', 'PAYPAL_ORDER_CREATED', 'AGREED']
const COMPLETED_STATUSES = ['CAPTURED']
const BLOCKED_STATUSES = ['POLICY_BLOCKED', 'BLOCKED_DRIFT', 'NEGOTIATION_FAILED', 'EXPIRED']

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [negotiations, setNegotiations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchNegotiations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/api/negotiations')
      setNegotiations(Array.isArray(data.negotiations) ? data.negotiations : [])
    } catch (err) {
      setError(err.message || 'Failed to load negotiations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    async function loadInitial() {
      try {
        const data = await api.get('/api/negotiations')
        if (!ignore) {
          setNegotiations(Array.isArray(data.negotiations) ? data.negotiations : [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load negotiations')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadInitial()
    return () => {
      ignore = true
    }
  }, [])

  // Summary counts
  const activeCount = negotiations.filter((n) => ACTIVE_STATUSES.includes(n.status)).length
  const completedCount = negotiations.filter((n) => COMPLETED_STATUSES.includes(n.status)).length
  const blockedCount = negotiations.filter((n) => BLOCKED_STATUSES.includes(n.status)).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Welcome & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B6B57]/10 text-[#0B6B57] text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#0B6B57] animate-pulse" />
            Autonomous Procurement Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12171F] tracking-tight">
            Procurement Dashboard
          </h1>
          <p className="text-sm text-[#12171F]/70 mt-1">
            Welcome back, <span className="font-semibold text-[#12171F]">{user?.name || 'Buyer'}</span> &bull; Manage your agent bargaining runs &amp; guardrails
          </p>
        </div>

        {/* Prominent "New negotiation" button */}
        <Link
          to="/negotiations/new"
          className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0B6B57] hover:bg-[#0B6B57]/90 text-white transition-all shadow-md shadow-[#0B6B57]/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Negotiation</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
        <SummaryCard
          title="Active Negotiations"
          count={activeCount}
          tone="active"
          description="Draft, Negotiating, Awaiting Approval, Order Created"
          icon={
            <svg className="w-5 h-5 text-[#0B6B57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <SummaryCard
          title="Completed Deals"
          count={completedCount}
          tone="completed"
          description="Cryptographically sealed & captured via PayPal"
          icon={
            <svg className="w-5 h-5 text-[#0B6B57]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <SummaryCard
          title="Blocked / Terminated"
          count={blockedCount}
          tone="blocked"
          description="Policy blocked, drift aborted, or failed"
          icon={
            <svg className="w-5 h-5 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-[#12171F]/10 shadow-sm overflow-hidden">
        {/* Table/Card Header */}
        <div className="p-5 sm:p-6 border-b border-[#12171F]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#12171F]">
              Negotiation Records
            </h2>
            <p className="text-xs text-[#12171F]/60 mt-0.5">
              Select any negotiation to review its agent transcript, policy verdict, and cryptographic snapshot.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={fetchNegotiations}
              disabled={loading}
              title="Refresh negotiations"
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#12171F]/80 hover:text-[#12171F] bg-[#F4F5F1] hover:bg-[#12171F]/10 border border-[#12171F]/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 px-4 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-[#0B6B57] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#12171F]">Loading negotiations...</p>
            <p className="text-xs text-[#12171F]/60 mt-1">Fetching your autonomous negotiation history</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#12171F] mb-1">Failed to load negotiations</h3>
            <p className="text-sm text-rose-700 max-w-md mx-auto mb-5">{error}</p>
            <button
              type="button"
              onClick={fetchNegotiations}
              className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#0B6B57] hover:bg-[#0B6B57]/90 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && negotiations.length === 0 && (
          <div className="py-16 px-4 sm:px-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#0B6B57]/10 text-[#0B6B57] flex items-center justify-center mx-auto mb-4 border border-[#0B6B57]/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#12171F] tracking-tight mb-2">
              No negotiations yet
            </h3>
            <p className="text-sm text-[#12171F]/70 leading-relaxed mb-6">
              You haven't initiated any autonomous procurement negotiations yet. Define your requirements and let your buyer agent bargain the optimal terms.
            </p>
            <Link
              to="/negotiations/new"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl font-bold text-sm bg-[#0B6B57] hover:bg-[#0B6B57]/90 text-white transition-all shadow-md shadow-[#0B6B57]/15 cursor-pointer gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Start Your First Negotiation</span>
            </Link>
          </div>
        )}

        {/* Data Present: Table on Desktop, Stacked Cards on Mobile */}
        {!loading && !error && negotiations.length > 0 && (
          <>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F5F1]/80 border-b border-[#12171F]/10 text-[11px] font-bold uppercase tracking-wider text-[#12171F]/60">
                    <th scope="col" className="py-3.5 px-6">Product</th>
                    <th scope="col" className="py-3.5 px-4 text-right">Quantity</th>
                    <th scope="col" className="py-3.5 px-4 text-right">Max Budget</th>
                    <th scope="col" className="py-3.5 px-6 text-center">Status</th>
                    <th scope="col" className="py-3.5 px-6">Created Date</th>
                    <th scope="col" className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12171F]/5 text-sm">
                  {negotiations.map((n) => {
                    const product = n.rules?.product || 'Unspecified'
                    const quantity = n.rules?.quantity ?? '-'
                    const budget = formatMoney(n.rules?.maxBudget, n.rules?.currency)
                    const date = formatDate(n.createdAt)

                    return (
                      <tr
                        key={n._id}
                        onClick={() => navigate(`/negotiations/${n._id}`)}
                        className="hover:bg-[#F4F5F1]/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 font-semibold text-[#12171F]">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[220px]" title={product}>
                              {product}
                            </span>
                            {n.sellerProfile?.simulated && (
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                Simulated
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-num text-[#12171F]/80">
                          {quantity}
                        </td>
                        <td className="py-4 px-4 text-right font-num font-semibold text-[#0B6B57]">
                          {budget}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={n.status} />
                        </td>
                        <td className="py-4 px-6 text-xs text-[#12171F]/70 font-num">
                          {date}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            to={`/negotiations/${n._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0B6B57] group-hover:text-[#0B6B57] hover:underline min-h-[44px] px-2"
                          >
                            <span>View</span>
                            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View (< md) */}
            <div className="md:hidden divide-y divide-[#12171F]/10">
              {negotiations.map((n) => {
                const product = n.rules?.product || 'Unspecified'
                const quantity = n.rules?.quantity ?? '-'
                const budget = formatMoney(n.rules?.maxBudget, n.rules?.currency)
                const date = formatDate(n.createdAt)

                return (
                  <Link
                    key={n._id}
                    to={`/negotiations/${n._id}`}
                    className="block p-4 sm:p-5 hover:bg-[#F4F5F1]/60 transition-colors focus:outline-none focus:bg-[#F4F5F1]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-[#12171F] truncate">
                          {product}
                        </h3>
                        <span className="text-[11px] text-[#12171F]/60 font-num">
                          Created {date}
                        </span>
                      </div>
                      <StatusBadge status={n.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-[#F4F5F1] border border-[#12171F]/5 text-xs">
                      <div>
                        <span className="text-[#12171F]/60 block text-[11px]">Quantity</span>
                        <span className="font-num font-bold text-[#12171F]">{quantity} units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#12171F]/60 block text-[11px]">Max Budget</span>
                        <span className="font-num font-bold text-[#0B6B57]">{budget}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs font-semibold text-[#0B6B57]">
                      <span>Open Negotiation Details</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
