'use client'

import { useState } from 'react'
import { AdminVideoItem } from '@/lib/admin/queries'
import { createLessonAction, updateLessonAction } from '@/lib/admin/actions'
import { X, Plus, Edit2, Loader2, Key } from 'lucide-react'

interface LessonModalProps {
  courseId: string
  lesson?: AdminVideoItem | null
  nextOrder: number
  isOpen: boolean
  onClose: () => void
}

function formatDurationPreview(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonModal({
  courseId,
  lesson,
  nextOrder,
  isOpen,
  onClose,
}: LessonModalProps) {
  const isEditing = Boolean(lesson)

  const [title, setTitle] = useState(lesson?.title || '')
  const [bunnyVideoId, setBunnyVideoId] = useState(lesson?.bunny_video_id || '')
  const [order, setOrder] = useState<number>(lesson?.order || nextOrder)
  const [duration, setDuration] = useState<number>(lesson?.duration || 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isEditing && lesson) {
        const res = await updateLessonAction(lesson.id, courseId, {
          title,
          bunny_video_id: bunnyVideoId,
          order,
          duration,
        })
        if (!res.success) {
          setError(res.error || 'Failed to update lesson')
          setLoading(false)
          return
        }
      } else {
        const res = await createLessonAction(courseId, {
          title,
          bunny_video_id: bunnyVideoId,
          order,
          duration,
        })
        if (!res.success) {
          setError(res.error || 'Failed to add lesson')
          setLoading(false)
          return
        }
      }

      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Lesson Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 01 - Understanding Distributed Consensus"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Bunny Stream Video ID (GUID)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={bunnyVideoId}
                onChange={(e) => setBunnyVideoId(e.target.value.trim())}
                placeholder="e.g. 48805f77-faea-47a3-83ec-19f85dcf7429"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Find this in your Bunny Stream dashboard under Video Details. Never exposed to students.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Lesson Order
              </label>
              <input
                type="number"
                min="1"
                required
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration (Seconds)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  required
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                  placeholder="300"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  {formatDurationPreview(duration)}
                </span>
              </div>
            </div>
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
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Lesson' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
