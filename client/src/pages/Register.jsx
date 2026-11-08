import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter your full name.')
      return
    }
    if (trimmedName.length > 80) {
      setError('Name must be 80 characters or fewer.')
      return
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password) {
      setError('Please choose a password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password.length > 100) {
      setError('Password must be 100 characters or fewer.')
      return
    }

    setLoading(true)
    try {
      await register(trimmedName, trimmedEmail, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#12171F]/10 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#0B6B57]/10 text-[#0B6B57] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-[#12171F] tracking-tight">Create Sentinel Account</h1>
            <p className="text-sm text-[#12171F]/60 mt-1">
              Start protected autonomous procurement today
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Jane Doe"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border border-[#12171F]/15 text-[#12171F] text-sm placeholder-[#12171F]/40 focus:outline-none focus:border-[#0B6B57] focus:ring-2 focus:ring-[#0B6B57]/15 transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                placeholder="jane@company.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border border-[#12171F]/15 text-[#12171F] text-sm placeholder-[#12171F]/40 focus:outline-none focus:border-[#0B6B57] focus:ring-2 focus:ring-[#0B6B57]/15 transition-all"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-[#12171F]/80 mb-1.5">
                Password <span className="text-[11px] font-normal text-[#12171F]/50">(min. 8 characters)</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="••••••••"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F4F5F1] border border-[#12171F]/15 text-[#12171F] text-sm placeholder-[#12171F]/40 focus:outline-none focus:border-[#0B6B57] focus:ring-2 focus:ring-[#0B6B57]/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] px-4 py-3 rounded-xl font-bold text-sm bg-[#0B6B57] hover:bg-[#0B6B57]/90 text-white transition-all shadow-md shadow-[#0B6B57]/10 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#12171F]/10 text-center text-xs text-[#12171F]/70">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#0B6B57] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

