import { redirect, notFound } from 'next/navigation'
import { connection } from 'next/server'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { SecurePlayer } from '@/components/player/SecurePlayer'
import { ProgressBar } from '@/components/course/ProgressBar'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Play,
  ShieldAlert,
} from 'lucide-react'
import { VideoWithProgress } from '@/types'

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>
}) {
  await connection()
  const { videoId } = await params
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect(`/login?redirectTo=/watch/${videoId}`)
  }

  const supabase = await createClient()

  // 1. Fetch current lesson via student_videos view (bunny_video_id is protected)
  const { data: currentLesson, error: lessonError } = await supabase
    .from('student_videos')
    .select('id, course_id, title, order, duration, created_at')
    .eq('id', videoId)
    .single()

  if (lessonError || !currentLesson) {
    notFound()
  }

  // 2. Fetch parent course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, description')
    .eq('id', currentLesson.course_id)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // 3. Verify enrollment or admin
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', profile.id)
    .eq('course_id', course.id)
    .maybeSingle()

  const isAdmin = profile.role === 'admin'
  const isEnrolled = !!enrollment || isAdmin

  if (!isEnrolled) {
    return (
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-16 text-center">
        <div className="glass-card p-10 rounded-3xl flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-[#d97706] mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-xs text-slate-600 mb-6 max-w-md">
            You do not have active enrollment for <strong>{course.title}</strong>. Please contact
            your course instructor.
          </p>
          <Link href="/dashboard" className="btn-accent text-xs font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // 4. Fetch all lessons in this course for the sidebar playlist
  const { data: allLessonsRaw } = await supabase
    .from('student_videos')
    .select('id, course_id, title, order, duration, created_at')
    .eq('course_id', course.id)
    .order('order', { ascending: true })

  const allLessonsList = allLessonsRaw || []
  const lessonIds = allLessonsList.map((l) => l.id)

  // 5. Fetch user's watch progress across all lessons
  const { data: progressRows } = await supabase
    .from('watch_progress')
    .select('video_id, completed, position_seconds')
    .eq('user_id', profile.id)
    .in('video_id', lessonIds)

  const progressMap = new Map<string, { completed: boolean; position_seconds: number }>()
  ;(progressRows || []).forEach((row) => {
    progressMap.set(row.video_id, {
      completed: row.completed,
      position_seconds: row.position_seconds,
    })
  })

  const lessons: VideoWithProgress[] = allLessonsList.map((l) => {
    const p = progressMap.get(l.id)
    return {
      ...l,
      watched: p?.completed ?? false,
      lastPositionSeconds: p?.position_seconds ?? 0,
    }
  })

  // Determine current, prev, next lesson indices
  const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id)
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  const currentProgress = progressMap.get(currentLesson.id)
  const initialPositionSeconds = currentProgress?.position_seconds || 0

  const totalLessons = lessons.length
  const completedLessons = lessons.filter((l) => l.watched).length
  const coursePercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link
          href="/dashboard"
          className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Courses</span>
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${course.id}`}
          className="hover:text-slate-900 transition-colors font-medium truncate max-w-[200px]"
        >
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[240px]">
          Lesson {currentLesson.order}: {currentLesson.title}
        </span>
      </div>

      {/* Main Grid: Player on Left, Lesson Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Player & Lesson Controls */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Secure Video Player */}
          <SecurePlayer
            videoId={currentLesson.id}
            userEmail={profile.email}
            initialPositionSeconds={initialPositionSeconds}
            hasNextLesson={!!nextLesson}
          />

          {/* Lesson Info & Previous/Next Navigation */}
          <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="badge-accent text-[11px]">Lesson {currentLesson.order}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(currentLesson.duration)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {currentLesson.title}
              </h1>
            </div>

            {/* Prev/Next Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {prevLesson ? (
                <Link
                  href={`/watch/${prevLesson.id}`}
                  className="btn-glass text-xs font-bold py-2 px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </Link>
              ) : (
                <button disabled className="btn-glass text-xs py-2 px-3 opacity-40 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
              )}

              {nextLesson ? (
                <Link
                  href={`/watch/${nextLesson.id}`}
                  className="btn-accent text-xs font-bold py-2 px-4 shadow-sm hover:shadow"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href={`/courses/${course.id}`}
                  className="btn-accent text-xs font-bold py-2 px-4 shadow-sm hover:shadow"
                >
                  <span>Finish Course</span>
                  <CheckCircle2 className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right: Lesson Playlist Sidebar */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-5 sm:p-6 flex flex-col max-h-[85vh] sticky top-24">
          <div className="mb-5 pb-4 border-b border-slate-200/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#d97706]">
              Course Syllabus
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate mt-0.5">
              {course.title}
            </h2>
            <div className="mt-4">
              <ProgressBar percentage={coursePercentage} showLabel={true} height="sm" />
            </div>
          </div>

          {/* Scrollable Lesson Items */}
          <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {lessons.map((lesson, idx) => {
              const isCurrent = lesson.id === currentLesson.id
              const numStr = (lesson.order || idx + 1).toString().padStart(2, '0')

              return (
                <Link
                  key={lesson.id}
                  href={`/watch/${lesson.id}`}
                  className={`p-3 rounded-xl flex items-center justify-between text-xs transition-all group ${
                    isCurrent
                      ? 'bg-[#ffc107]/20 border border-[#ffc107] font-bold text-slate-900 shadow-sm'
                      : 'hover:bg-black/5 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        isCurrent
                          ? 'bg-[#ffc107] text-black shadow-sm'
                          : lesson.watched
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {lesson.watched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      ) : (
                        <span>{numStr}</span>
                      )}
                    </div>

                    <div className="truncate">
                      <p className="truncate leading-tight font-medium group-hover:text-[#d97706] transition-colors">
                        {lesson.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {formatDuration(lesson.duration)}
                      </span>
                    </div>
                  </div>

                  {lesson.watched && (
                    <span className="text-[10px] text-emerald-600 font-semibold shrink-0 ml-2">
                      Done
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
