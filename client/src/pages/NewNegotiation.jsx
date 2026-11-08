import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'

const PRESET_EXAMPLES = [
  {
    title: '💻 10 Business Laptops (USD)',
    text: 'I want to purchase 10 business laptops with 16GB RAM. Maximum budget is 4000 USD and delivery must happen within 7 days. Explicit human approval mandatory before any payment.',
    manual: {
      product: 'business laptop',
      quantity: 10,
      maxBudget: 4000,
      currency: 'USD',
      maxDeliveryDays: 7,
      requiresApproval: true,
    },
  },
  {
    title: '🪑 25 Ergonomic Chairs (USD)',
    text: 'We need 25 ergonomic mesh office desk chairs. The absolute budget ceiling is 3200 USD. Delivery within 10 days required.',
    manual: {
      product: 'ergonomic mesh desk chair',
      quantity: 25,
      maxBudget: 3200,
      currency: 'USD',
      maxDeliveryDays: 10,
      requiresApproval: true,
    },
  },
  {
    title: '🖥️ 50 Office Monitors (INR)',
    text: 'Procure 50 business monitors for office workstations. Total budget limit is 400000 INR. Delivery must take place within 14 days.',
    manual: {
      product: 'business monitor',
      quantity: 50,
      maxBudget: 400000,
      currency: 'INR',
      maxDeliveryDays: 14,
      requiresApproval: true,
    },
  },
]

export default function NewNegotiation() {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const productInputRef = useRef(null)

  // Step 1: Natural Language Instructions
  const [instructions, setInstructions] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [parseSuccess, setParseSuccess] = useState(false)

  // Step 2: Financial Rules (Deterministic Guardrails)
  const [rules, setRules] = useState({
    product: '',
    quantity: '',
    maxBudget: '',
    currency: 'USD',
    maxDeliveryDays: '',
    requiresApproval: true,
  })

  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  // AI Interpretation Handler
  const handleInterpretAI = async () => {
    const trimmed = instructions.trim()
    if (!trimmed) {
      setParseError('Please enter procurement instructions before interpreting with AI.')
      return
    }
    if (trimmed.length < 10) {
      setParseError('Instructions must be at least 10 characters long.')
      return
    }

    setParsing(true)
    setParseError(null)
    setParseSuccess(false)
    setServerError(null)

    try {
      const res = await api.post('/api/negotiations/parse', { instructions: trimmed })
      const draft = res?.draft || {}

      setRules((prev) => ({
        product: draft.product ?? prev.product ?? '',
        quantity: draft.quantity != null ? draft.quantity : prev.quantity,
        maxBudget: draft.maxBudget != null ? draft.maxBudget : prev.maxBudget,
        currency: draft.currency ? draft.currency.toUpperCase() : prev.currency,
        maxDeliveryDays: draft.maxDeliveryDays != null ? draft.maxDeliveryDays : prev.maxDeliveryDays,
        requiresApproval: draft.requiresApproval ?? true,
      }))

      setParseSuccess(true)
      // Clear any prior validation errors
      setFormErrors({})

      // Scroll to Step 2
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setParseError(
        err.message || 'AI interpretation is temporarily unavailable. You can click "Fill in manually" to proceed.'
      )
    } finally {
      setParsing(false)
    }
  }

  // Skip AI and fill in manually
  const handleFillManually = () => {
    setParseError(null)
    setParseSuccess(false)
    // If user clicked manually without typing instructions, pre-fill from form if product exists or prompt
    if (!instructions.trim() && rules.product) {
      setInstructions(`Procure ${rules.quantity || 1} ${rules.product} for maximum budget of ${rules.maxBudget || ''} ${rules.currency} within ${rules.maxDeliveryDays || 7} days.`)
    }
    // Smoothly scroll and focus product field
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      productInputRef.current?.focus()
    }, 100)
  }

  // Preset quick fill
  const applyPreset = (preset) => {
    setInstructions(preset.text)
    setRules({
      product: preset.manual.product,
      quantity: preset.manual.quantity,
      maxBudget: preset.manual.maxBudget,
      currency: preset.manual.currency,
      maxDeliveryDays: preset.manual.maxDeliveryDays,
      requiresApproval: preset.manual.requiresApproval,
    })
    setParseError(null)
    setParseSuccess(false)
    setFormErrors({})
  }

  // Client-side validation
  const validateForm = () => {
    const errors = {}

    // Instructions validation (required by backend schema: min 10, max 2000)
    const trimmedInstructions = instructions.trim()
    if (!trimmedInstructions) {
      errors.instructions = 'Procurement instructions are required.'
    } else if (trimmedInstructions.length < 10) {
      errors.instructions = 'Instructions must be at least 10 characters.'
    } else if (trimmedInstructions.length > 2000) {
      errors.instructions = 'Instructions must not exceed 2,000 characters.'
    }

    // Product validation
    const trimmedProduct = String(rules.product || '').trim()
    if (!trimmedProduct) {
      errors.product = 'Product name is required.'
    } else if (trimmedProduct.length > 80) {
      errors.product = 'Product name cannot exceed 80 characters.'
    }

    // Quantity validation (positive integer)
    const qNum = Number(rules.quantity)
    if (!rules.quantity || isNaN(qNum)) {
      errors.quantity = 'Quantity is required.'
    } else if (!Number.isInteger(qNum) || qNum <= 0) {
      errors.quantity = 'Quantity must be a positive integer.'
    } else if (qNum > 100000) {
      errors.quantity = 'Quantity cannot exceed 100,000.'
    }

    // Max Budget validation (positive number)
    const bNum = Number(rules.maxBudget)
    if (!rules.maxBudget || isNaN(bNum)) {
      errors.maxBudget = 'Maximum budget is required.'
    } else if (bNum <= 0) {
      errors.maxBudget = 'Maximum budget must be greater than zero.'
    } else if (bNum > 1e9) {
      errors.maxBudget = 'Maximum budget exceeds allowed limit.'
    }

    // Currency validation
    if (!['USD', 'INR'].includes(rules.currency)) {
      errors.currency = 'Currency must be USD or INR.'
    }

    // Max Delivery Days validation (positive integer)
    const dNum = Number(rules.maxDeliveryDays)
    if (!rules.maxDeliveryDays || isNaN(dNum)) {
      errors.maxDeliveryDays = 'Max delivery days SLA is required.'
    } else if (!Number.isInteger(dNum) || dNum <= 0) {
      errors.maxDeliveryDays = 'Delivery days must be a positive integer.'
    } else if (dNum > 365) {
      errors.maxDeliveryDays = 'Delivery days cannot exceed 365.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Final Submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        instructions: instructions.trim(),
        rules: {
          product: rules.product.trim(),
          quantity: Number(rules.quantity),
          maxBudget: Number(rules.maxBudget),
          currency: rules.currency,
          maxDeliveryDays: Number(rules.maxDeliveryDays),
          requiresApproval: Boolean(rules.requiresApproval),
        },
      }

      const res = await api.post('/api/negotiations', payload)
      const newId = res?.negotiation?._id

      if (!newId) {
        throw new Error('Failed to retrieve new negotiation identifier.')
      }

      // Navigate to the newly created negotiation page
      navigate(`/negotiations/${newId}`)
    } catch (err) {
      setServerError(err.message || 'Failed to create negotiation. Please verify all inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Navigation Breadcrumb / Back Link */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B6B57] hover:underline min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12171F] tracking-tight">
          Create New Negotiation
        </h1>
        <p className="text-sm text-[#12171F]/70 mt-1">
          Define your procurement intent and configure deterministic financial guardrails for autonomous agent bargaining.
        </p>
      </div>

      {/* Simulated Seller Notice (Requirement 5) */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#0D1F1A] text-white border border-[#0B6B57]/40 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6EE0BE]/20 text-[#6EE0BE] flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Simulated Seller Notice</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#6EE0BE]/15 text-[#6EE0BE] border border-[#6EE0BE]/30">
                Sandbox Environment
              </span>
            </h3>
            <p className="text-xs text-white/80 leading-relaxed mt-1">
              For demonstration and security benchmarking, seller agents operate against simulated merchant profiles with undisclosed price floors. The buyer agent will negotiate autonomously within your budget ceilings. No real funds can be moved without explicit human snapshot authorization and Integrity Shield verification.
            </p>
          </div>
        </div>
      </div>

      {/* Global Server Error Banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in"
        >
          <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="font-bold block">Submission Error</strong>
            <span>{serverError}</span>
          </div>
        </div>
      )}

      {/* Step 1: Natural Language Instructions (Requirement 4a) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#12171F]/10 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#0B6B57]/10 text-[#0B6B57] font-bold text-xs flex items-center justify-center shrink-0 border border-[#0B6B57]/20">
            01
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#12171F]">
              Step 1: Procurement Instructions
            </h2>
            <p className="text-xs text-[#12171F]/60">
              Describe what you want to purchase in plain English.
            </p>
          </div>
        </div>

        {/* Quick Example Presets */}
        <div className="mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#12171F]/60 block mb-2">
            Quick Examples:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_EXAMPLES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F4F5F1] hover:bg-[#0B6B57]/10 text-[#12171F] hover:text-[#0B6B57] border border-[#12171F]/10 hover:border-[#0B6B57]/30 transition-all cursor-pointer"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <label htmlFor="instructions-input" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-2">
            Procurement Intent / Natural Language Order
          </label>
          <textarea
            id="instructions-input"
            rows={4}
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value)
              if (parseError) setParseError(null)
              if (formErrors.instructions) {
                setFormErrors((prev) => ({ ...prev, instructions: undefined }))
              }
            }}
            placeholder="e.g. I want to purchase 10 business laptops with 16GB RAM. Maximum budget is 4000 USD and delivery must happen within 7 days. Explicit human approval mandatory before any payment."
            className={`w-full p-4 rounded-2xl bg-[#F4F5F1] border ${
              formErrors.instructions ? 'border-rose-400 focus:ring-rose-200' : 'border-[#12171F]/15 focus:border-[#0B6B57] focus:ring-[#0B6B57]/15'
            } text-[#12171F] text-sm placeholder-[#12171F]/40 focus:outline-none focus:ring-2 transition-all font-sans`}
          />
          {formErrors.instructions && (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              {formErrors.instructions}
            </p>
          )}
          <p className="mt-1 text-[11px] text-[#12171F]/50">
            Min 10 characters, max 2,000 characters.
          </p>
        </div>

        {/* AI Parse Error */}
        {parseError && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <strong className="font-semibold block">AI Parser Notice</strong>
              <span>{parseError}</span>
            </div>
          </div>
        )}

        {/* AI Parse Success */}
        {parseSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#6EE0BE]/15 border border-[#6EE0BE]/40 text-[#0B6B57] text-xs flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[#0B6B57] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <strong className="font-semibold block">Requirements Extracted</strong>
              <span>AI has populated the deterministic financial rules below. Please review and fine-tune your values.</span>
            </div>
          </div>
        )}

        {/* Actions: "Interpret with AI" + "Fill in manually" link */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-[#12171F]/5">
          <button
            type="button"
            onClick={handleInterpretAI}
            disabled={parsing || !instructions.trim()}
            className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#0D1F1A] hover:bg-[#0D1F1A]/90 text-[#6EE0BE] border border-[#6EE0BE]/30 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {parsing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#6EE0BE] border-t-transparent rounded-full animate-spin" />
                <span>Interpreting with AI...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[#6EE0BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Interpret with AI</span>
              </>
            )}
          </button>

          {/* Optional skip link: "Fill in manually" */}
          <button
            type="button"
            onClick={handleFillManually}
            className="min-h-[44px] px-4 py-2 text-xs font-bold text-[#0B6B57] hover:text-[#0B6B57]/80 hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Or fill in rules manually (skip AI)</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Step 2: Financial Rules Form (Requirement 4b) */}
      <section
        ref={formRef}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-[#12171F]/10 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#0B6B57]/10 text-[#0B6B57] font-bold text-xs flex items-center justify-center shrink-0 border border-[#0B6B57]/20">
            02
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#12171F]">
              Step 2: Financial Rules &amp; Guardrails
            </h2>
            <p className="text-xs text-[#12171F]/60">
              Deterministic parameters that strictly constrain agent counteroffers.
            </p>
          </div>
        </div>

        {/* Mandatory Note: "These rules are enforced by backend code, not by the AI." */}
        <div className="mb-6 p-4 rounded-2xl bg-[#0B6B57]/10 border border-[#0B6B57]/25 text-[#0B6B57] text-xs flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-[#0B6B57] text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <strong className="font-bold text-[#0D1F1A] block text-sm">
              Strict Deterministic Code Enforcement
            </strong>
            <p className="mt-0.5 text-[#0D1F1A]/80 leading-relaxed font-medium">
              These rules are enforced by backend code, not by the AI.
            </p>
            <p className="mt-0.5 text-xs text-[#0D1F1A]/70">
              Any seller offer or buyer deal exceeding your budget, altering quantity, or missing SLA dates is automatically blocked by the policy engine before approval.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {/* Product */}
            <div className="sm:col-span-2">
              <label htmlFor="rule-product" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Product / Item Name *
              </label>
              <input
                ref={productInputRef}
                id="rule-product"
                type="text"
                value={rules.product}
                onChange={(e) => {
                  setRules({ ...rules, product: e.target.value })
                  if (formErrors.product) setFormErrors({ ...formErrors, product: undefined })
                }}
                placeholder="e.g. business laptop"
                maxLength={80}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border ${
                  formErrors.product ? 'border-rose-400 focus:ring-rose-200' : 'border-[#12171F]/15 focus:border-[#0B6B57] focus:ring-[#0B6B57]/15'
                } text-[#12171F] text-sm placeholder-[#12171F]/40 focus:outline-none focus:ring-2 transition-all`}
              />
              {formErrors.product && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.product}</p>
              )}
              <p className="mt-1 text-[11px] text-[#12171F]/50">Max 80 characters.</p>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="rule-quantity" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Quantity (Units) *
              </label>
              <input
                id="rule-quantity"
                type="number"
                min="1"
                max="100000"
                step="1"
                value={rules.quantity}
                onChange={(e) => {
                  setRules({ ...rules, quantity: e.target.value })
                  if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: undefined })
                }}
                placeholder="e.g. 10"
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border ${
                  formErrors.quantity ? 'border-rose-400 focus:ring-rose-200' : 'border-[#12171F]/15 focus:border-[#0B6B57] focus:ring-[#0B6B57]/15'
                } text-[#12171F] text-sm font-num placeholder-[#12171F]/40 focus:outline-none focus:ring-2 transition-all`}
              />
              {formErrors.quantity && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.quantity}</p>
              )}
              <p className="mt-1 text-[11px] text-[#12171F]/50">Must be a positive integer.</p>
            </div>

            {/* Max Budget */}
            <div>
              <label htmlFor="rule-budget" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Maximum Budget Cap *
              </label>
              <input
                id="rule-budget"
                type="number"
                min="0.01"
                step="any"
                value={rules.maxBudget}
                onChange={(e) => {
                  setRules({ ...rules, maxBudget: e.target.value })
                  if (formErrors.maxBudget) setFormErrors({ ...formErrors, maxBudget: undefined })
                }}
                placeholder="e.g. 4000"
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border ${
                  formErrors.maxBudget ? 'border-rose-400 focus:ring-rose-200' : 'border-[#12171F]/15 focus:border-[#0B6B57] focus:ring-[#0B6B57]/15'
                } text-[#12171F] text-sm font-num placeholder-[#12171F]/40 focus:outline-none focus:ring-2 transition-all`}
              />
              {formErrors.maxBudget && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.maxBudget}</p>
              )}
              <p className="mt-1 text-[11px] text-[#12171F]/50">Total ceiling across all units.</p>
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="rule-currency" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Currency *
              </label>
              <select
                id="rule-currency"
                value={rules.currency}
                onChange={(e) => {
                  setRules({ ...rules, currency: e.target.value })
                  if (formErrors.currency) setFormErrors({ ...formErrors, currency: undefined })
                }}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border ${
                  formErrors.currency ? 'border-rose-400 focus:ring-rose-200' : 'border-[#12171F]/15 focus:border-[#0B6B57] focus:ring-[#0B6B57]/15'
                } text-[#12171F] text-sm font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer`}
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
              {formErrors.currency && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.currency}</p>
              )}
            </div>

            {/* Max Delivery Days */}
            <div>
              <label htmlFor="rule-delivery-days" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Max Delivery Days (SLA) *
              </label>
              <input
                id="rule-delivery-days"
                type="number"
                min="1"
                max="365"
                step="1"
                value={rules.maxDeliveryDays}
                onChange={(e) => {
                  setRules({ ...rules, maxDeliveryDays: e.target.value })
                  if (formErrors.maxDeliveryDays) setFormErrors({ ...formErrors, maxDeliveryDays: undefined })
                }}
                placeholder="e.g. 7"
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border ${
                  formErrors.maxDeliveryDays ? 'border-rose-400 focus:ring-rose-200' : 'border-[#12171F]/15 focus:border-[#0B6B57] focus:ring-[#0B6B57]/15'
                } text-[#12171F] text-sm font-num placeholder-[#12171F]/40 focus:outline-none focus:ring-2 transition-all`}
              />
              {formErrors.maxDeliveryDays && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{formErrors.maxDeliveryDays}</p>
              )}
              <p className="mt-1 text-[11px] text-[#12171F]/50">Max calendar days from agreement to delivery.</p>
            </div>
          </div>

          {/* Requires Human Approval Checkbox (Requirement & Schema) */}
          <div className="mb-8 p-4 rounded-2xl bg-[#F4F5F1] border border-[#12171F]/10">
            <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={rules.requiresApproval}
                onChange={(e) => setRules({ ...rules, requiresApproval: e.target.checked })}
                className="w-5 h-5 rounded mt-0.5 text-[#0B6B57] focus:ring-[#0B6B57] border-[#12171F]/20 cursor-pointer"
              />
              <div>
                <span className="text-sm font-bold text-[#12171F] block">
                  Require Explicit Human Approval Before Payment
                </span>
                <span className="text-xs text-[#12171F]/70 block mt-0.5 leading-relaxed">
                  (Default and Recommended) After agents complete bargaining, an immutable SHA-256 agreement snapshot is created. You must explicitly review and authorize the exact terms before any PayPal order or payment capture can proceed.
                </span>
              </div>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-[#12171F]/10">
            <Link
              to="/dashboard"
              className="min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-semibold text-[#12171F]/70 hover:text-[#12171F] bg-[#F4F5F1] hover:bg-[#12171F]/10 transition-colors flex items-center justify-center cursor-pointer text-center"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-8 py-3 rounded-xl font-bold text-sm bg-[#0B6B57] hover:bg-[#0B6B57]/90 text-white transition-all shadow-md shadow-[#0B6B57]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Negotiation...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Confirm Rules &amp; Create Negotiation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

