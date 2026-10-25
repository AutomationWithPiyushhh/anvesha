'use client'

import { useState } from 'react'
import { Course } from '@/types'
import { AdminStudentItem } from '@/lib/admin/queries'
import { EnrollStudentModal } from '@/components/admin/EnrollStudentModal'
import {
  unenrollStudentAction,
  resetStudentDevicesAction,
} from '@/lib/admin/actions'
import {
  Users,
  Search,
  UserPlus,
  Laptop,
  GraduationCap,
  X,
  RotateCcw,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Tv,
} from 'lucide-react'

interface StudentsManagerProps {
  initialStudents: AdminStudentItem[]
  courses: Course[]
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown Browser / OS'
  if (ua.includes('Windows')) return 'Windows • ' + (ua.includes('Chrome') ? 'Chrome' : 'Browser')
  if (ua.includes('Macintosh')) return 'macOS • ' + (ua.includes('Safari') ? 'Safari' : 'Browser')
  if (ua.includes('iPhone')) return 'iPhone (iOS)'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Linux')) return 'Linux'
  return ua.slice(0, 32)
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  } catch {
    return dateStr
  }
}

export function StudentsManager({
  initialStudents,
  courses,
}: StudentsManagerProps) {
  const [students] = useState<AdminStudentItem[]>(initialStudents)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all')

  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [enrollPrefillEmail, setEnrollPrefillEmail] = useState('')

  const [unrollingId, setUnenrollingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleOpenEnroll = (email?: string) => {
    setEnrollPrefillEmail(email || '')
    setEnrollModalOpen(true)
  }

  const handleUnenroll = async (
    student: AdminStudentItem,
    courseId: string,
    courseTitle: string
  ) => {
    const confirm = window.confirm(
      `Remove enrollment for ${student.name} from "${courseTitle}"?`
    )
    if (!confirm) return

    setUnenrollingId(`${student.id}-${courseId}`)
    try {
      const res = await unenrollStudentAction(student.id, courseId)
      if (!res.success) {
        showNotification('error', res.error || 'Failed to unenroll student')
      } else {
        showNotification('success', `Unenrolled ${student.name} from "${courseTitle}"`)
      }
    } catch (err: unknown) {
      showNotification(
        'error',
        err instanceof Error ? err.message : 'Failed to unenroll student'
      )
    } finally {
      setUnenrollingId(null)
    }
  }

  const handleResetDevices = async (student: AdminStudentItem) => {
    const confirm = window.confirm(
      `Reset device registrations for ${student.name} (${student.email})?\n\nThis will clear all ${student.sessions.length} registered hardware device(s). The student will be able to register up to 2 new devices on their next login.`
    )
    if (!confirm) return

    setResettingId(student.id)
    try {
      const res = await resetStudentDevicesAction(student.id)
      if (!res.success) {
        showNotification('error', res.error || 'Failed to reset devices')
      } else {
        showNotification(
          'success',
          res.message || `Device registrations cleared for ${student.name}`
        )
      }
    } catch (err: unknown) {
      showNotification(
        'error',
        err instanceof Error ? err.message : 'Failed to reset devices'
      )
    } finally {
      setResettingId(null)
    }
  }

  // Filter students
  const filtered = students.filter((student) => {
    const matchesRole = roleFilter === 'all' || student.role === roleFilter
    const term = search.toLowerCase().trim()
    if (!term) return matchesRole

    const matchesName = student.name?.toLowerCase().includes(term)
    const matchesEmail = student.email.toLowerCase().includes(term)
    const matchesCourse = student.enrollments.some((e) =>
      e.course_title.toLowerCase().includes(term)
    )

    return matchesRole && (matchesName || matchesEmail || matchesCourse)
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Students & Device Management
          </h1>
          <p className="text-sm text-slate-600">
            Audit enrolled courses, manage authorizations, and reset hardware device sessions.
          </p>
        </div>

        <button
          onClick={() => handleOpenEnroll()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2.5 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, email, or course..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Role:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                roleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                roleFilter === 'student'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No students match your query</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or filter settings.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((student) => {
            const deviceCount = student.sessions.length
            const isAtDeviceLimit = deviceCount >= 2

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Header Row: Student Profile & Reset Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-serif font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                      {student.name ? student.name[0].toUpperCase() : student.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {student.name || 'Anonymous Student'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            student.role === 'admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {student.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>{student.email}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Joined {new Date(student.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device Reset button */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleResetDevices(student)}
                      disabled={resettingId === student.id || deviceCount === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-40"
                      title="Clear all registered devices for this student"
                    >
                      {resettingId === student.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      Reset Devices
                    </button>
                  </div>
                </div>

                {/* Lower Row: 2 Columns (Courses + Devices) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Left: Enrolled Courses */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                        Enrolled Courses ({student.enrollments.length})
                      </span>
                      <button
                        onClick={() => handleOpenEnroll(student.email)}
                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                      >
                        + Enroll
                      </button>
                    </div>

                    {student.enrollments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No courses enrolled</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {student.enrollments.map((enr) => {
                          const isUnenrolling =
                            unrollingId === `${student.id}-${enr.course_id}`
                          return (
                            <span
                              key={enr.course_id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              <span>{enr.course_title}</span>
                              <button
                                onClick={() =>
                                  handleUnenroll(student, enr.course_id, enr.course_title)
                                }
                                disabled={isUnenrolling}
                                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Unenroll from this course"
                              >
                                {isUnenrolling ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Hardware Devices Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-blue-500" />
                        Registered Devices
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isAtDeviceLimit
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {deviceCount} / 2 Slots Used
                      </span>
                    </div>

                    {student.sessions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No devices registered yet (0/2 slots used).
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {student.sessions.map((sess) => (
                          <div
                            key={sess.device_id}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="space-y-0.5">
                                <span className="font-medium text-slate-800">
                                  {parseUserAgent(sess.user_agent)}
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  ID: {sess.device_id.slice(0, 12)}...
                                </div>
                              </div>
                            </div>

                            <div className="text-right space-y-0.5">
                              <span className="text-[11px] text-slate-500 block">
                                {formatRelativeTime(sess.last_active)}
                              </span>
                              {sess.playing_video_id && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <Tv className="w-2.5 h-2.5 animate-pulse" />
                                  Watching
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <EnrollStudentModal
        courses={courses}
        prefillEmail={enrollPrefillEmail}
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
      />
    </div>
  )
}
