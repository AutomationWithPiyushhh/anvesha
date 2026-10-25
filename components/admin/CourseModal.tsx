'use client'

import { useState } from 'react'
import { Course } from '@/types'
import { createCourseAction, updateCourseAction } from '@/lib/admin/actions'
import { X, Plus, Edit2, Loader2, Image as ImageIcon } from 'lucide-react'

interface CourseModalProps {
  course?: Course | null
  isOpen: boolean
  onClose: () => void
}

export function CourseModal({ course, isOpen, onClose }: CourseModalProps) {
  const isEditing = Boolean(course)

  const [title, setTitle] = useState(course?.title || '')
  const [description, setDescription] = useState(course?.description || '')
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || '')
  const [priceInr, setPriceInr] = useState<number>(course?.price_inr ?? 4999)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isEditing && course) {
        const res = await updateCourseAction(course.id, {
          title,
          description,
          thumbnail,
          price_inr: priceInr,
        })
        if (!res.success) {
          setError(res.error || 'Failed to update course')
          setLoading(false)
          return
        }
      } else {
        const res = await createCourseAction({
          title,
          description,
          thumbnail,
          price_inr: priceInr,
        })
        if (!res.success) {
          setError(res.error || 'Failed to create course')
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
              {isEditing ? 'Edit Course' : 'Create New Course'}
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
              Course Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Production Distributed Systems in Go"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Master consensus algorithms, Raft, Paxos, and distributed state machines with live coding..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Thumbnail Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() =>
                  setThumbnail(
                    'https://images.unsplash.com/photo-1516116211227-bbc8e7ec8374?auto=format&fit=crop&w=1200&q=80'
                  )
                }
                className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
                title="Use sample coding image"
              >
                Sample
              </button>
            </div>
          </div>

          {thumbnail && (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 max-h-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnail}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Preview
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Course Tuition Price (INR ₹)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={priceInr}
                onChange={(e) => setPriceInr(parseInt(e.target.value, 10) || 0)}
                placeholder="4999"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Enter 0 for free enrollment, or set the price for Razorpay and UPI checkout.
            </p>
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
              {isEditing ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
