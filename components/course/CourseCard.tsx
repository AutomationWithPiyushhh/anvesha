import Link from 'next/link'
import Image from 'next/image'
import { CourseWithProgress } from '@/types'
import { ProgressBar } from '@/components/course/ProgressBar'
import { PlayCircle, CheckCircle2, ArrowRight } from 'lucide-react'

interface CourseCardProps {
  course: CourseWithProgress
}

export function CourseCard({ course }: CourseCardProps) {
  const isCompleted = course.totalLessons > 0 && course.completedLessons === course.totalLessons

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group h-full">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black text-[#ffc107]">
            <PlayCircle className="w-12 h-12 opacity-80" />
          </div>
        )}

        <div className="absolute top-3 right-3">
          {isCompleted ? (
            <span className="badge-accent bg-emerald-500/20 text-emerald-800 border-emerald-500/40 text-[10px] font-bold shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Completed
            </span>
          ) : (
            <span className="badge-accent text-[10px] font-bold shadow-sm">
              {course.totalLessons} {course.totalLessons === 1 ? 'Lesson' : 'Lessons'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#d97706] transition-colors line-clamp-1">
            {course.title}
          </h3>
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200/80">
          <ProgressBar
            percentage={course.progressPercentage}
            className="mb-4"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {course.completedLessons} of {course.totalLessons} completed
            </span>
            <Link
              href={`/courses/${course.id}`}
              className="font-bold text-slate-900 hover:text-[#d97706] flex items-center gap-1 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
