'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Suppress leaking tokens or internal details
    console.error('Application Error:', error.message)
  }, [error])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">Something Went Wrong</h1>
        <p className="text-sm text-slate-600 mb-6">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 btn-accent text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 btn-glass text-sm"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
