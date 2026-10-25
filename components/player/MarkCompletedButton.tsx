'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface MarkCompletedButtonProps {
  videoId: string
  initialCompleted: boolean
  className?: string
}

export function MarkCompletedButton({
  videoId,
  initialCompleted,
  className = '',
}: MarkCompletedButtonProps) {
  const router = useRouter()
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)

  const toggleCompleted = async () => {
    const nextState = !completed
    setCompleted(nextState) // Optimistic update
    setLoading(true)

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          positionSeconds: nextState ? 99999 : 0,
          completed: nextState,
        }),
      })

      if (!res.ok) {
        // Revert on failure
        setCompleted(!nextState)
      } else {
        router.refresh()
      }
    } catch {
      setCompleted(!nextState)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleCompleted}
      disabled={loading}
      title={completed ? 'Click to mark as uncompleted' : 'Click to mark lesson completed'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
        completed
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 shadow-2xs'
          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-amber-400 shadow-2xs'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
      ) : completed ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-slate-400" />
      )}
      <span>{completed ? 'Completed' : 'Mark Complete'}</span>
    </button>
  )
}
