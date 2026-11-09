import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import StatusBadge from '../components/StatusBadge'
import ChatBubble from '../components/ChatBubble'
import RulesPanel from '../components/RulesPanel'
import PolicyChecks from '../components/PolicyChecks'
import ProgressSteps from '../components/ProgressSteps'

function getFailureDetails(events = []) {
  const failEvent = [...events].reverse().find((e) =>
    ['NEGOTIATION_FAILED', 'NEGOTIATION_ERROR', 'NEGOTIATION_INTERRUPTED'].includes(e.type)
  )
  if (!failEvent) {
    return 'Agents were unable to agree on terms within the allowed rounds.'
  }

  const details = failEvent.details || {}
  return (
    details.reason ||
    details.message ||
    details.error ||
    (typeof details === 'string' ? details : 'Negotiation terminated without agreement.')
  )
}

export default function NegotiationRoom() {
  const { id } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isNotFound, setIsNotFound] = useState(false)

  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(null)

  const messagesEndRef = useRef(null)

  // Initial fetch
  const loadNegotiation = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    setIsNotFound(false)
    try {
      const res = await api.get(`/api/negotiations/${id}`)
      setData(res)
    } catch (err) {
      if (err.message?.toLowerCase().includes('not found') || err.message?.includes('404')) {
        setIsNotFound(true)
      } else {
        setError(err.message || 'Failed to load negotiation')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let ignore = false
    async function loadInitial() {
      if (!id) return
      try {
        const res = await api.get(`/api/negotiations/${id}`)
        if (!ignore) {
          setData(res)
        }
      } catch (err) {
        if (!ignore) {
          if (err.message?.toLowerCase().includes('not found') || err.message?.includes('404')) {
            setIsNotFound(true)
          } else {
            setError(err.message || 'Failed to load negotiation')
          }
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
  }, [id])

  const negotiation = data?.negotiation
  const status = negotiation?.status
  const messages = data?.messages || []
  const agreement = data?.agreement
  const events = data?.events || []
  const sellerProfile = negotiation?.sellerProfile

  // Polling effect: when status is NEGOTIATING, poll every 3 seconds
  // Stop polling when status changes or on unmount
  useEffect(() => {
    if (status !== 'NEGOTIATING' || !id) return

    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/api/negotiations/${id}`)
        if (res && res.negotiation) {
          setData(res)
        }
      } catch (pollErr) {
        // Polling errors handled gracefully without crashing or clearing data
        console.warn('Negotiation poll error:', pollErr)
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [id, status])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Handler for Start negotiation button (POST /api/negotiations/:id/run, expects 202)
  const handleStartNegotiation = async () => {
    setStarting(true)
    setStartError(null)
    try {
      await api.post(`/api/negotiations/${id}/run`)
      // Refetch negotiation state immediately
      const updated = await api.get(`/api/negotiations/${id}`)
      setData(updated)
    } catch (err) {
      setStartError(err.message || 'Failed to start negotiation')
    } finally {
      setStarting(false)
    }
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#0B6B57] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#12171F]">Loading negotiation room...</p>
        <p className="text-xs text-[#12171F]/60 mt-1">Fetching live transcript and guardrail status</p>
      </div>
    )
  }

  // 2. 404 State
  if (isNotFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#12171F] mb-2">Negotiation Not Found</h2>
        <p className="text-sm text-[#12171F]/70 mb-6">
          The requested negotiation does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  // 3. Error State
  if (error || !negotiation) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#12171F] mb-1">Failed to Load Negotiation</h2>
        <p className="text-sm text-rose-700 mb-6">{error || 'An unexpected error occurred.'}</p>
        <button
          type="button"
          onClick={loadNegotiation}
          className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] text-white hover:bg-[#0B6B57]/90 transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    )
  }

  const rules = negotiation.rules || {}

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header: product, quantity, StatusBadge, and Simulated seller notice */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B6B57] hover:underline mb-2 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12171F] tracking-tight">
                {rules.product || sellerProfile?.product || 'Procurement Negotiation'}
              </h1>
              <StatusBadge status={status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#12171F]/70">
              {rules.quantity != null && (
                <span className="font-semibold text-[#12171F] font-num">
                  Quantity: {rules.quantity} {rules.quantity === 1 ? 'unit' : 'units'}
                </span>
              )}
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Simulated seller
              </span>
              <span>&bull;</span>
              <Link
                to={`/negotiations/${id}/audit`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B6B57] hover:underline min-h-[36px]"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View audit trail
              </Link>
            </div>
          </div>
        </div>

        {/* ProgressSteps Pipeline Component */}
        <ProgressSteps status={status} />
      </div>

      {/* Main Grid: Responsive stacked on mobile, two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left/Main Column: Transcript, Status Actions & Agreement Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Start Error Banner */}
          {startError && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
            >
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong className="font-bold block">Could not start negotiation</strong>
                <span>{startError}</span>
              </div>
            </div>
          )}

          {/* Conditional Action / Status Callouts */}

          {/* 1. When status is DRAFT: "Start negotiation" button */}
          {status === 'DRAFT' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0D1F1A] text-white border border-[#0B6B57]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Start Autonomous Bargaining</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#6EE0BE]/20 text-[#6EE0BE]">
                    Draft Ready
                  </span>
                </h3>
                <p className="text-xs text-white/70 mt-1 leading-relaxed max-w-md">
                  Launch the Gemini buyer agent to negotiate optimal price and SLA terms against the simulated seller.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartNegotiation}
                disabled={starting}
                className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] hover:bg-[#0B6B57]/90 text-white transition-all shadow-md shadow-[#0B6B57]/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-[#6EE0BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Start Negotiation</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 2. When status is NEGOTIATING: Live round counter, polling note, and speed disclaimer */}
          {status === 'NEGOTIATING' && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <strong className="text-sm font-bold text-amber-950">
                    Agents are negotiating...
                  </strong>
                </div>
                <span className="text-xs font-bold font-num bg-amber-200/80 text-amber-900 px-3 py-1 rounded-full border border-amber-300 self-start sm:self-auto">
                  Round {negotiation.roundsUsed || 0} of {negotiation.maxRounds || 6}
                </span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Gemini AI is evaluating offers and formulating counterproposals within your financial parameters.
                <span className="font-semibold block sm:inline sm:ml-1">
                  Note that Gemini can be slow, but this negotiation run will continue even if you close or refresh this page.
                </span>
              </p>
            </div>
          )}

          {/* 3. When status is NEGOTIATION_FAILED: Failure reason from audit events + no retry note */}
          {status === 'NEGOTIATION_FAILED' && (
            <div className="p-5 rounded-3xl bg-zinc-100 border border-zinc-300 text-zinc-900 space-y-3">
              <div className="flex items-center gap-2 text-zinc-800">
                <svg className="w-5 h-5 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-bold text-zinc-900">
                  Negotiation Terminated
                </h3>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 text-xs">
                <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">
                  Failure Reason (from Audit Trail)
                </span>
                <p className="text-zinc-800 font-medium leading-relaxed">
                  {getFailureDetails(events)}
                </p>
              </div>

              <p className="text-xs text-zinc-500 italic">
                Note: Retrying is not yet supported. You may configure and launch a new negotiation with adjusted rules from the dashboard.
              </p>
            </div>
          )}

          {/* 4. When an agreement exists: PolicyChecks component */}
          {agreement && (
            <PolicyChecks agreement={agreement} />
          )}

          {/* 5. When status is AWAITING_APPROVAL: "Review and approve" button */}
          {status === 'AWAITING_APPROVAL' && (
            <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/80 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <span>Agreement Reached &bull; Awaiting Your Approval</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Policy Verified
                  </span>
                </h3>
                <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed max-w-md">
                  Both buyer and seller agents reached consensus and passed all deterministic policy constraints. Review the finalized snapshot terms to issue authorization.
                </p>
              </div>

              <Link
                to={`/negotiations/${id}/approve`}
                className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0B6B57] hover:bg-[#0B6B57]/90 text-white transition-all shadow-md shadow-[#0B6B57]/20 flex items-center justify-center gap-2 shrink-0 text-center cursor-pointer"
              >
                <span>Review and Approve</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* Transcript Box */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#12171F]/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#12171F]/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B6B57]" />
                <h2 className="text-base sm:text-lg font-bold text-[#12171F]">
                  Agent Dialogue Transcript
                </h2>
              </div>
              <span className="text-xs text-[#12171F]/60 font-num">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>

            {/* Message Stream */}
            <div className="min-h-[220px]">
              {messages.length === 0 ? (
                <div className="py-14 px-4 text-center">
                  {status === 'DRAFT' ? (
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B6B57]/10 text-[#0B6B57] flex items-center justify-center mx-auto mb-2 border border-[#0B6B57]/20">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-[#12171F]">
                        Ready to Begin Bargaining
                      </p>
                      <p className="text-xs text-[#12171F]/60 leading-relaxed">
                        Review the buyer procurement rules in the right panel, then click &ldquo;Start Negotiation&rdquo; to begin agent exchanges.
                      </p>
                    </div>
                  ) : status === 'NEGOTIATING' ? (
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-8 h-8 border-3 border-[#0B6B57] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-bold text-[#12171F]">
                        Initializing Dialogue with AI Agents...
                      </p>
                      <p className="text-xs text-[#12171F]/60">
                        Gemini is computing the opening counterproposal.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#12171F]/50">
                      No dialogue messages recorded for this session.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, idx) => (
                    <ChatBubble
                      key={m._id || idx}
                      message={m}
                      sellerName={sellerProfile?.name}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: RulesPanel */}
        <div className="lg:col-span-1 space-y-6">
          <RulesPanel
            rules={rules}
            sellerProfile={sellerProfile}
          />
        </div>
      </div>
    </div>
  )
}
