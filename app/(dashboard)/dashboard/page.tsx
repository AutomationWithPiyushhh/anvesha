import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentProfile } from '@/lib/auth/session'
import { getCatalogCourses } from '@/lib/courses/queries'
import { CourseCard } from '@/components/course/CourseCard'
import { EnrollButton } from '@/components/course/EnrollButton'
import { BookOpen, Flame, ArrowRight, Sparkles, Play, ShieldCheck } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  const { enrolled: enrolledCourses, available: availableCourses } =
    await getCatalogCourses(profile.id)

  const totalEnrolled = enrolledCourses.length
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
              Track your software engineering lessons, resume where you left off, and explore new curriculum tracks.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-white/70 p-3 sm:p-4 rounded-2xl border border-white/90 shadow-sm shrink-0">
            <div className="text-center px-3 border-r border-slate-200">
              <span className="block text-xl font-extrabold text-slate-900">{totalEnrolled}</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                {totalEnrolled === 1 ? 'Track' : 'Tracks'}
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

      {/* ================= 1. ENROLLED COURSES SECTION ================= */}
      {enrolledCourses.length > 0 && (
        <div className="mb-14">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">My Enrolled Tracks</h2>
              <p className="text-xs text-slate-500">
                Active modules with recorded video progress and personal study notes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {enrolledCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* ================= 2. EXPLORE AVAILABLE CATALOG ================= */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {enrolledCourses.length === 0
                  ? 'Engineering Curriculum Tracks'
                  : 'Explore More Available Tracks'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                {availableCourses.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unlock instant lifetime access via online payment or submit an enrollment request to your instructor.
            </p>
          </div>
        </div>

        {availableCourses.length === 0 && enrolledCourses.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center max-w-xl mx-auto">
            <BookOpen className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No Courses Published Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your instructor is preparing new curriculum modules. Check back soon!
            </p>
          </div>
        ) : availableCourses.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            You are enrolled in all currently published curriculum tracks! 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {availableCourses.map((course) => {
              const priceTag =
                course.price_inr > 0 ? `₹${course.price_inr.toLocaleString('en-IN')}` : 'Free'

              return (
                <div
                  key={course.id}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border border-slate-200/80 bg-white"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ffc107]">
                        <Play className="w-10 h-10 fill-current opacity-80" />
                      </div>
                    )}

                    {/* Price Pill */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900/90 text-amber-300 backdrop-blur-md border border-slate-700 shadow-sm">
                        {priceTag}
                      </span>
                    </div>

                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                        {course.totalLessons} {course.totalLessons === 1 ? 'Lesson' : 'Lessons'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#d97706] transition-colors line-clamp-1 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                        {course.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <EnrollButton
                        courseId={course.id}
                        courseTitle={course.title}
                        priceInr={course.price_inr}
                        hasPendingRequest={course.hasPendingRequest}
                        className="w-full justify-center"
                      />

                      <Link
                        href={`/courses/${course.id}`}
                        className="text-center py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Preview Syllabus & Details →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
