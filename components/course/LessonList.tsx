import Link from 'next/link'
import { VideoWithProgress } from '@/types'
import { Play, CheckCircle2, Clock } from 'lucide-react'

interface LessonListProps {
  lessons: VideoWithProgress[]
  courseId?: string
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function LessonList({ lessons }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center">
        <p className="text-sm font-semibold text-slate-700">No lessons uploaded yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Your instructor is preparing the engineering lectures for this track.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson, idx) => {
        const lessonNumber = (lesson.order || idx + 1).toString().padStart(2, '0')

        return (
          <Link
            key={lesson.id}
            href={`/watch/${lesson.id}`}
            className="glass-card p-4 sm:p-5 rounded-2xl flex items-center justify-between group hover:border-[#ffc107] transition-all"
          >
            <div className="flex items-center gap-4">
              {/* Order Badge / Play Indicator */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                  lesson.watched
                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                    : 'bg-slate-100 text-slate-700 group-hover:bg-[#ffc107] group-hover:text-black border border-slate-200/80'
                }`}
              >
                {lesson.watched ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <span>{lessonNumber}</span>
                )}
              </div>

              {/* Title & Metadata */}
              <div>
                <h4 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-[#d97706] transition-colors line-clamp-1">
                  {lesson.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDuration(lesson.duration)}
                  </span>

                  {lesson.watched ? (
                    <span className="text-emerald-600 font-semibold text-[11px]">
                      Completed
                    </span>
                  ) : lesson.lastPositionSeconds > 0 ? (
                    <span className="text-[#d97706] font-medium text-[11px]">
                      Resume from {formatDuration(lesson.lastPositionSeconds)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Play Button Icon */}
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#ffc107] text-slate-600 group-hover:text-black flex items-center justify-center transition-all shrink-0 ml-4">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
