import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth/session'
import { getEnrolledCourses } from '@/lib/courses/queries'
import { CourseCard } from '@/components/course/CourseCard'
import { BookOpen, Flame, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  const enrolledCourses = await getEnrolledCourses(profile.id)

  const totalCourses = enrolledCourses.length
  const totalLessons = enrolledCourses.reduce((acc, c) => acc + c.totalLessons, 0)
  const completedLessons = enrolledCourses.reduce((acc, c) => acc + c.completedLessons, 0)
  const overallPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Welcome Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl mb-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#ffc107] rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="badge-accent mb-3">
              <Flame className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Student Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Track your software engineering lessons, resume where you left off, and master
              production architectures.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-white/70 p-3 sm:p-4 rounded-2xl border border-white/90 shadow-sm shrink-0">
            <div className="text-center px-3 border-r border-slate-200">
              <span className="block text-xl font-extrabold text-slate-900">{totalCourses}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                {totalCourses === 1 ? 'Track' : 'Tracks'}
              </span>
            </div>

            <div className="text-center px-3 border-r border-slate-200">
              <span className="block text-xl font-extrabold text-emerald-600">
                {completedLessons}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Completed</span>
            </div>

            <div className="text-center px-3">
              <span className="block text-xl font-extrabold text-[#d97706]">
                {overallPercentage}%
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Enrolled Engineering Tracks</h2>
          <p className="text-xs text-slate-500">
            Select a module to view video lessons and practice materials
          </p>
        </div>
      </div>

      {enrolledCourses.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-12 sm:p-16 rounded-3xl text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#d97706] flex items-center justify-center mb-5 shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">No Enrolled Courses Yet</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 max-w-md leading-relaxed">
            You are signed in as <strong>{profile.email}</strong>, but have not yet been granted
            access to any engineering courses. Please contact your instructor to enroll your account.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/"
              className="btn-glass text-xs"
            >
              Back to Overview
            </Link>
            {profile.role === 'admin' && (
              <Link
                href="/admin"
                className="btn-accent text-xs font-semibold"
              >
                <span>Go to Admin Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Grid of enrolled course cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {enrolledCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
