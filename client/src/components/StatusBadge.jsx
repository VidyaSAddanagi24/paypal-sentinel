import React from 'react'
import { getStatusConfig } from '../lib/format'

export default function StatusBadge({ status, className = '' }) {
  const config = getStatusConfig(status)

  return (
    <span
      title={config.description || config.label}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} shrink-0 transition-colors ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      <span className="truncate">{config.label}</span>
    </span>
  )
}

