'use client'

import { useState } from 'react'
import { Course } from '@/types'
import { enrollStudentAction } from '@/lib/admin/actions'
import { X, UserPlus, Loader2 } from 'lucide-react'

interface EnrollStudentModalProps {
  courses: Course[]
  prefillEmail?: string
  isOpen: boolean
  onClose: () => void
}

export function EnrollStudentModal({
  courses,
  prefillEmail = '',
  isOpen,
  onClose,
}: EnrollStudentModalProps) {
  const [email, setEmail] = useState(prefillEmail)
  const [courseId, setCourseId] = useState(courses[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await enrollStudentAction(email, courseId)
      if (!res.success) {
        setError(res.error || 'Failed to enroll student')
      } else {
        setSuccessMsg(res.message || 'Student enrolled successfully!')
        setTimeout(() => {
          onClose()
        }, 1200)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Enroll Student</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 leading-relaxed">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Student Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The student must already have registered an account on ANVESHA with this email.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Course
            </label>
            <select
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || courses.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Grant Enrollment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
