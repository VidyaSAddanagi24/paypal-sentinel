import React, { useState, useEffect } from 'react'

/**
 * Displays a live countdown to a target date.
 * Shows "Expired" once the target is in the past.
 */
export default function Countdown({ expiresAt, label = 'Authorization expires in' }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!expiresAt) return

    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      setRemaining(diff)
    }

    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!expiresAt) return null

  if (remaining === null) return null

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border bg-rose-50 text-rose-800 border-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        Expired
      </span>
    )
  }

  const totalSecs = Math.floor(remaining / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  const formatted = h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
    : `${m}m ${String(s).padStart(2, '0')}s`

  const isUrgent = remaining < 5 * 60 * 1000 // < 5 min

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
        isUrgent
          ? 'bg-amber-50 text-amber-800 border-amber-300'
          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isUrgent ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
        }`}
      />
      <span>{label}:</span>
      <span className="font-mono">{formatted}</span>
    </span>
  )
}

