'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeviceError, setIsDeviceError] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setIsDeviceError(false)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to authenticate')
        if (data.code === 'DEVICE_LIMIT_REACHED') {
          setIsDeviceError(true)
        }
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('An unexpected network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card w-full max-w-md p-8 sm:p-10 rounded-3xl relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#ffc107] rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#ffc107] text-black font-extrabold text-2xl flex items-center justify-center mb-3 shadow-sm">
          A
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Student Sign In
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access your private software engineering video modules
        </p>
      </div>

      {error && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-xs font-medium ${
            isDeviceError
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-900'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {isDeviceError ? (
            <ShieldAlert className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">{isDeviceError ? 'Device Restriction' : 'Authentication Error'}</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="custom-input pl-10"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="custom-input pl-10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-accent w-full py-3 mt-2 text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/signup"
            className="font-semibold text-slate-900 hover:text-[#d97706] transition-colors"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Suspense fallback={
        <div className="glass-card w-full max-w-md p-8 rounded-3xl animate-pulse text-center">
          <p className="text-sm font-semibold text-slate-700">Loading sign in...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
