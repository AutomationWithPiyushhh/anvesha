import { createClient } from '@/lib/supabase/server'
import { CourseWithProgress, VideoWithProgress } from '@/types'

/**
 * Retrieves all courses in which the given user is enrolled,
 * with calculated lesson completion progress.
 * Note: Videos are queried via the `student_videos` view to ensure
 * bunny_video_id is never fetched or sent to client code.
 */
export async function getEnrolledCourses(userId: string): Promise<CourseWithProgress[]> {
  const supabase = await createClient()

  // 1. Fetch user's enrollments with course details
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('course_id, courses (*)')
    .eq('user_id', userId)

  if (enrollError || !enrollments) {
    return []
  }

  const courses = enrollments
    .map((e) => e.courses)
    .filter((c): c is NonNullable<typeof c> => c !== null)

  if (courses.length === 0) {
    return []
  }

  const courseIds = courses.map((c) => c.id)

  // 2. Fetch video metadata via student_videos view (excludes bunny_video_id)
  const { data: videos } = await supabase
    .from('student_videos')
    .select('id, course_id')
    .in('course_id', courseIds)

  // 3. Fetch user's watch progress
  const videoIds = (videos || []).map((v) => v.id)
  const { data: progressList } = await supabase
    .from('watch_progress')
    .select('video_id, completed')
    .eq('user_id', userId)
    .in('video_id', videoIds)

  const completedVideoIds = new Set(
    (progressList || []).filter((p) => p.completed).map((p) => p.video_id)
  )

  // Group videos by course
  const videosByCourse: Record<string, string[]> = {}
  ;(videos || []).forEach((v) => {
    if (!videosByCourse[v.course_id]) {
      videosByCourse[v.course_id] = []
    }
    videosByCourse[v.course_id]!.push(v.id)
  })

  // 4. Calculate progress statistics for each course
  return courses.map((course) => {
    const courseVideoIds = videosByCourse[course.id] || []
    const totalLessons = courseVideoIds.length
    const completedLessons = courseVideoIds.filter((id) => completedVideoIds.has(id)).length
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      ...course,
      totalLessons,
      completedLessons,
      progressPercentage,
    }
  })
}

export interface CourseDetailResult {
  course: CourseWithProgress
  lessons: VideoWithProgress[]
  isEnrolled: boolean
}

/**
 * Retrieves full details for a course, including ordered lessons with watched checkmarks.
 * Uses `student_videos` view to protect bunny_video_id.
 */
export async function getCourseDetails(
  courseId: string,
  userId: string
): Promise<CourseDetailResult | null> {
  const supabase = await createClient()

  // 1. Fetch course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return null
  }

  // 2. Check enrollment or admin role
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const isAdmin = profile?.role === 'admin'
  const isEnrolled = !!enrollment || isAdmin

  // 3. Fetch lessons from student_videos view ordered by "order" ascending
  const { data: lessonsData } = await supabase
    .from('student_videos')
    .select('id, course_id, title, order, duration, created_at')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  const rawLessons = lessonsData || []
  const lessonIds = rawLessons.map((l) => l.id)

  // 4. Fetch watch progress for user
  const { data: progressRows } = await supabase
    .from('watch_progress')
    .select('video_id, completed, position_seconds')
    .eq('user_id', userId)
    .in('video_id', lessonIds)

  const progressMap = new Map<string, { completed: boolean; position_seconds: number }>()
  ;(progressRows || []).forEach((row) => {
    progressMap.set(row.video_id, {
      completed: row.completed,
      position_seconds: row.position_seconds,
    })
  })

  const lessons: VideoWithProgress[] = rawLessons.map((l) => {
    const p = progressMap.get(l.id)
    return {
      ...l,
      watched: p?.completed ?? false,
      lastPositionSeconds: p?.position_seconds ?? 0,
    }
  })

  const totalLessons = lessons.length
  const completedLessons = lessons.filter((l) => l.watched).length
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const courseWithProgress: CourseWithProgress = {
    ...course,
    totalLessons,
    completedLessons,
    progressPercentage,
  }

  return {
    course: courseWithProgress,
    lessons,
    isEnrolled,
  }
}
