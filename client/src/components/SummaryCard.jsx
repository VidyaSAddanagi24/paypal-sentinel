import React from 'react'

export default function SummaryCard({
  title,
  count = 0,
  description,
  tone = 'default',
  icon,
  className = '',
}) {
  // Tone accents
  const toneStyles = {
    active: {
      badgeBg: 'bg-[#0B6B57]/10 text-[#0B6B57] border-[#0B6B57]/20',
      accentDot: 'bg-[#0B6B57]',
      numColor: 'text-[#0B6B57]',
    },
    completed: {
      badgeBg: 'bg-[#6EE0BE]/20 text-[#0B6B57] border-[#6EE0BE]/40',
      accentDot: 'bg-[#6EE0BE]',
      numColor: 'text-[#0D1F1A]',
    },
    blocked: {
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      accentDot: 'bg-rose-500',
      numColor: 'text-rose-700',
    },
    default: {
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      accentDot: 'bg-slate-400',
      numColor: 'text-[#12171F]',
    },
  }

  const currentTone = toneStyles[tone] || toneStyles.default

  return (
    <div
      className={`bg-white rounded-2xl p-5 sm:p-6 border border-[#12171F]/10 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#12171F]/60 block mb-1">
            {title}
          </span>
          <div className={`font-num text-3xl sm:text-4xl font-extrabold tracking-tight ${currentTone.numColor}`}>
            {count}
          </div>
        </div>

        {icon ? (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${currentTone.badgeBg}`}>
            {icon}
          </div>
        ) : (
          <div className="w-2.5 h-2.5 rounded-full mt-2 shrink-0">
            <span className={`block w-2.5 h-2.5 rounded-full ${currentTone.accentDot}`} />
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-[#12171F]/60 pt-3 border-t border-[#12171F]/5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

