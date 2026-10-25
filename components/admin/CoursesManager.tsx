'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AdminCourseItem } from '@/lib/admin/queries'
import { CourseModal } from '@/components/admin/CourseModal'
import { deleteCourseAction } from '@/lib/admin/actions'
import {
  Plus,
  BookOpen,
  Users,
  Video,
  Edit2,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface CoursesManagerProps {
  initialCourses: AdminCourseItem[]
}

export function CoursesManager({ initialCourses }: CoursesManagerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<AdminCourseItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOpenCreate = () => {
    setSelectedCourse(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (course: AdminCourseItem) => {
    setSelectedCourse(course)
    setModalOpen(true)
  }

  const handleDelete = async (course: AdminCourseItem) => {
    const confirm = window.confirm(
      `Are you sure you want to delete "${course.title}"? All associated lessons and enrollments will be deleted permanently.`
    )
    if (!confirm) return

    setDeletingId(course.id)
    setError(null)

    try {
      const res = await deleteCourseAction(course.id)
      if (!res.success) {
        setError(res.error || 'Failed to delete course')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete course')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Course Catalog
          </h1>
          <p className="text-sm text-slate-600">
            Publish courses, manage lesson curricula, and configure video streaming IDs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Courses Grid / Cards */}
      {initialCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No courses created yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Create Course&quot; to publish your first engineering course.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group hover:border-slate-300 transition-all"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-xs font-medium">
                      <Video className="w-3 h-3 text-amber-400" />
                      {course.lessonCount} {course.lessonCount === 1 ? 'Lesson' : 'Lessons'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {course.enrolledCount} Enrolled Students
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      target="_blank"
                      className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      Preview
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/courses/${course.id}/lessons`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-xs"
                >
                  <Video className="w-3.5 h-3.5" />
                  Lessons ({course.lessonCount})
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(course)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    title="Edit Course"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    disabled={deletingId === course.id}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    title="Delete Course"
                  >
                    {deletingId === course.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CourseModal
        isOpen={modalOpen}
        course={selectedCourse}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
