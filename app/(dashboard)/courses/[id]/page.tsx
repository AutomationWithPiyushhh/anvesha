import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentProfile } from '@/lib/auth/session'
import { getCourseDetails } from '@/lib/courses/queries'
import { LessonList } from '@/components/course/LessonList'
import { ProgressBar } from '@/components/course/ProgressBar'
import { ClaimCertificateButton } from '@/components/certificate/ClaimCertificateButton'
import { EnrollButton } from '@/components/course/EnrollButton'
import { getCertificate } from '@/lib/certificates/actions'
import { ArrowLeft, Play, BookOpen, Clock, CheckCircle2, Award } from 'lucide-react'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseId } = await params
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  const [result, existingCert] = await Promise.all([
    getCourseDetails(courseId, profile.id),
    getCertificate(courseId, profile.id),
  ])

  if (!result) {
    notFound()
  }

  const { course, lessons, isEnrolled, pendingRequest } = result

  // Find next lesson to watch (first unwatched lesson, or first lesson if none completed)
  const nextLesson = lessons.find((l) => !l.watched) || lessons[0]

  const totalSeconds = lessons.reduce((acc, l) => acc + (l.duration || 0), 0)
  const totalHours = (totalSeconds / 3600).toFixed(1)
  const priceTag = course.price_inr > 0 ? `₹${course.price_inr.toLocaleString('en-IN')}` : 'Free'

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Courses</span>
        </Link>
      </div>

      {/* Course Hero Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10 mb-10 overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#ffc107] rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Info */}
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge-accent">Software Engineering Track</span>
              {!isEnrolled && (
                <span className="text-xs font-mono font-bold text-slate-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                  {priceTag}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              {course.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {course.description}
            </p>

            {/* Stats Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-6 font-medium">
              <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
                <BookOpen className="w-4 h-4 text-[#d97706]" />
                {course.totalLessons} {course.totalLessons === 1 ? 'Lesson' : 'Lessons'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
                <Clock className="w-4 h-4 text-[#d97706]" />
                ~{totalHours} hours total
              </span>
              {isEnrolled && (
                <span className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {course.completedLessons} completed
                </span>
              )}
            </div>

            {/* Certificate Banner (100% Completed or Claimed) */}
            {isEnrolled && (course.progressPercentage === 100 || existingCert) && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    Verified Completion Certificate Unlocked!
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    You have mastered all curriculum lessons. View or export your accredited certificate.
                  </p>
                </div>
                <ClaimCertificateButton
                  courseId={course.id}
                  existingCertId={existingCert?.id}
                />
              </div>
            )}

            {/* Action CTA: Resume / Start (if enrolled) OR Enroll / Request (if not enrolled) */}
            {isEnrolled ? (
              nextLesson && (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/watch/${nextLesson.id}`}
                    className="btn-accent px-6 py-3 text-sm font-bold shadow-md hover:shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {course.completedLessons > 0 ? 'Resume Learning' : 'Start Learning'}
                    </span>
                  </Link>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    Next: {nextLesson.title}
                  </span>
                </div>
              )
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <EnrollButton
                  courseId={course.id}
                  courseTitle={course.title}
                  priceInr={course.price_inr}
                  hasPendingRequest={Boolean(pendingRequest)}
                />
                <span className="text-xs text-slate-500">
                  Instant unlock via UPI / Razorpay, or submit an enrollment request for manual instructor approval.
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail & Progress Card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-sm bg-slate-900">
              {course.thumbnail ? (
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ffc107]">
                  <Play className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              {isEnrolled ? (
                <ProgressBar
                  percentage={course.progressPercentage}
                  className="mb-1"
                />
              ) : (
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Track Tuition</span>
                  <span className="font-mono text-amber-700 font-bold text-sm">{priceTag}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Lesson List */}
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Curriculum Lessons</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEnrolled
                ? 'Follow lessons sequentially to master the core concepts'
                : 'Preview course syllabus and technical topics before enrolling'}
            </p>
          </div>
        </div>

        <LessonList lessons={lessons} courseId={course.id} isEnrolled={isEnrolled} />
      </div>
    </div>
  )
}
