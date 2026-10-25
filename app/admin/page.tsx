import Link from 'next/link'
import { getAdminStats } from '@/lib/admin/queries'
import {
  Users,
  BookOpen,
  Video,
  GraduationCap,
  Laptop,
  PlusCircle,
  UserPlus,
  ShieldCheck,
  Key,
  Flame,
  ArrowRight,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  const metricCards = [
    {
      label: 'Total Students',
      value: stats.studentCount,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Active Courses',
      value: stats.courseCount,
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Video Lessons',
      value: stats.videoCount,
      icon: Video,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      label: 'Total Enrollments',
      value: stats.enrollmentCount,
      icon: GraduationCap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Active Device Sessions',
      value: stats.deviceSessionCount,
      icon: Laptop,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Administrator Console
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time telemetry, curriculum management, and student device security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Manage Courses
          </Link>
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            Enroll Student
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.border} border`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Security Posture & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Security Stack Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Security & Anti-Piracy Pipeline
                </h2>
                <p className="text-xs text-slate-500">
                  Active protections guarding ANVESHA course media
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Key className="w-4 h-4 text-amber-500" />
                Bunny CDN Token
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Path-based SHA256 directory tokens. Media segments inherit security scope automatically without query string leakage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Flame className="w-4 h-4 text-rose-500" />
                Dynamic Watermark
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Per-student email watermark drifting every 22s across the screen canvas with DOM MutationObserver tamper-proofing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Laptop className="w-4 h-4 text-blue-500" />
                2-Device Limit
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                HttpOnly hardware tokens enforce maximum 2 authorized devices per account with single concurrent playback arbitration.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold">Instructor Advisory:</strong> To reset device registrations for a student who switched laptops or browsers, navigate to{' '}
            <Link href="/admin/students" className="underline font-bold text-amber-950">
              Students & Devices
            </Link>{' '}
            and click <em>Reset Devices</em>.
          </div>
        </div>

        {/* Right Col: Quick Access Hub */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Quick Management
            </h2>
            <div className="mt-4 space-y-3">
              <Link
                href="/admin/courses"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Course Catalog
                  </div>
                  <div className="text-xs text-slate-500">
                    {stats.courseCount} courses, {stats.videoCount} lessons
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/admin/students"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Student Enrollments
                  </div>
                  <div className="text-xs text-slate-500">
                    {stats.studentCount} registered students
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Student View
                  </div>
                  <div className="text-xs text-slate-500">
                    Preview student dashboard experience
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
            ANVESHA Engine v1.0 • Turbopack & React 19
          </div>
        </div>
      </div>
    </div>
  )
}
