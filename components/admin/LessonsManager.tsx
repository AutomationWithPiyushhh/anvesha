'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Course } from '@/types'
import { AdminVideoItem } from '@/lib/admin/queries'
import { LessonModal } from '@/components/admin/LessonModal'
import { deleteLessonAction, reorderLessonsAction } from '@/lib/admin/actions'
import {
  ArrowLeft,
  Plus,
  Video,
  Clock,
  Edit2,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react'

interface LessonsManagerProps {
  course: Course
  initialVideos: AdminVideoItem[]
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonsManager({ course, initialVideos }: LessonsManagerProps) {
  const [videos, setVideos] = useState<AdminVideoItem[]>(initialVideos)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<AdminVideoItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOpenAdd = () => {
    setSelectedLesson(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (lesson: AdminVideoItem) => {
    setSelectedLesson(lesson)
    setModalOpen(true)
  }

  const handleCopyId = (bunnyId: string) => {
    navigator.clipboard.writeText(bunnyId)
    setCopiedId(bunnyId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (lesson: AdminVideoItem) => {
    const confirm = window.confirm(
      `Are you sure you want to delete lesson "${lesson.title}"?`
    )
    if (!confirm) return

    setDeletingId(lesson.id)
    setError(null)

    try {
      const res = await deleteLessonAction(lesson.id, course.id)
      if (!res.success) {
        setError(res.error || 'Failed to delete lesson')
      } else {
        setVideos((prev) => prev.filter((v) => v.id !== lesson.id))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson')
    } finally {
      setDeletingId(null)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= videos.length) return

    const newVideos = [...videos]
    const temp = newVideos[index]
    newVideos[index] = newVideos[targetIndex]
    newVideos[targetIndex] = temp

    // Reassign order 1..N
    const reorderedPayload = newVideos.map((v, i) => ({
      id: v.id,
      order: i + 1,
    }))

    // Optimistically update UI
    setVideos(
      newVideos.map((v, i) => ({
        ...v,
        order: i + 1,
      }))
    )

    setReordering(true)
    try {
      const res = await reorderLessonsAction(course.id, reorderedPayload)
      if (!res.success) {
        setError(res.error || 'Failed to reorder lessons')
        // Revert to initial
        setVideos(initialVideos)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reorder lessons')
      setVideos(initialVideos)
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Courses
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {course.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {videos.length} {videos.length === 1 ? 'Lesson' : 'Lessons'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure curriculum sequence, video durations, and private Bunny Stream IDs.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Lesson
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Security notice regarding Bunny Video ID */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 flex items-start gap-3 shadow-sm border border-slate-800">
        <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs leading-relaxed space-y-1">
          <span className="font-semibold text-white">Security Isolation:</span> Bunny Stream Video IDs are strictly confidential. Students never receive these raw IDs; they are granted ephemeral, directory-scoped HLS tokens generated on-the-fly by the ANVESHA backend.
        </div>
      </div>

      {/* Lesson List */}
      {videos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No lessons added yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add your first lesson with its Bunny Stream Video ID to publish streaming content.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Lesson
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {videos.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
              >
                {/* Left: Reorder & Info */}
                <div className="flex items-center gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0 || reordering}
                      className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-400 w-5 text-center">
                      #{lesson.order}
                    </span>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === videos.length - 1 || reordering}
                      className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & metadata */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      {lesson.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDuration(lesson.duration)}
                      </span>

                      {/* Bunny Video ID Badge */}
                      <button
                        onClick={() => handleCopyId(lesson.bunny_video_id)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] border border-slate-200 transition-colors"
                        title="Click to copy Bunny Video ID"
                      >
                        <span>Bunny ID: {lesson.bunny_video_id.slice(0, 8)}...</span>
                        {copiedId === lesson.bunny_video_id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEdit(lesson)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    title="Edit Lesson"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(lesson)}
                    disabled={deletingId === lesson.id}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    title="Delete Lesson"
                  >
                    {deletingId === lesson.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <LessonModal
        courseId={course.id}
        lesson={selectedLesson}
        nextOrder={videos.length + 1}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
