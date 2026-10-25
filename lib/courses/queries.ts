import { createClient } from '@/lib/supabase/server'
import { CourseWithProgress, VideoWithProgress } from '@/types'

export interface AvailableCourseItem extends CourseWithProgress {
  hasPendingRequest: boolean
}

export interface CatalogResult {
  enrolled: CourseWithProgress[]
  available: AvailableCourseItem[]
}

/**
 * Retrieves all courses in which the given user is enrolled,
 * with calculated lesson completion progress.
 */
export async function getEnrolledCourses(userId: string): Promise<CourseWithProgress[]> {
  const { enrolled } = await getCatalogCourses(userId)
  return enrolled
}

/**
 * Retrieves the full course catalog separated into:
 * 1. Enrolled courses (with completion stats)
 * 2. Available courses for discovery (with price & enrollment request status)
 */
export async function getCatalogCourses(userId: string): Promise<CatalogResult> {
  const supabase = await createClient()

  // 1. Fetch all courses
  const { data: allCoursesRaw, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  const allCourses = allCoursesRaw || []
  if (courseError || allCourses.length === 0) {
    return { enrolled: [], available: [] }
  }

  const courseIds = allCourses.map((c) => c.id)

  // 2. Fetch user's enrollments & pending requests in parallel
  const [{ data: enrollments }, { data: requests }, { data: videos }] = await Promise.all([
    supabase.from('enrollments').select('course_id').eq('user_id', userId),
    supabase
      .from('enrollment_requests')
      .select('course_id, status')
      .eq('user_id', userId)
      .eq('status', 'pending'),
    supabase.from('student_videos').select('id, course_id').in('course_id', courseIds),
  ])

  const enrolledSet = new Set((enrollments || []).map((e) => e.course_id))
  const pendingSet = new Set((requests || []).map((r) => r.course_id))

  // 3. Fetch progress for all enrolled videos
  const enrolledVideoIds = (videos || [])
    .filter((v) => enrolledSet.has(v.course_id))
    .map((v) => v.id)

  const { data: progressList } =
    enrolledVideoIds.length > 0
      ? await supabase
          .from('watch_progress')
          .select('video_id, completed')
          .eq('user_id', userId)
          .in('video_id', enrolledVideoIds)
      : { data: [] }

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

  const enrolled: CourseWithProgress[] = []
  const available: AvailableCourseItem[] = []

  allCourses.forEach((c) => {
    const courseVideoIds = videosByCourse[c.id] || []
    const totalLessons = courseVideoIds.length
    const completedLessons = courseVideoIds.filter((id) => completedVideoIds.has(id)).length
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    const item: CourseWithProgress = {
      ...c,
      totalLessons,
      completedLessons,
      progressPercentage,
    }

    if (enrolledSet.has(c.id)) {
      enrolled.push(item)
    } else {
      available.push({
        ...item,
        hasPendingRequest: pendingSet.has(c.id),
      })
    }
  })

  return { enrolled, available }
}

export interface CourseDetailResult {
  course: CourseWithProgress
  lessons: VideoWithProgress[]
  isEnrolled: boolean
  pendingRequest: { id: string; status: string } | null
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

  // 2. Check enrollment or admin role, and pending requests
  const [{ data: enrollment }, { data: profile }, { data: pendingReq }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle(),
    supabase.from('profiles').select('role').eq('id', userId).single(),
    supabase
      .from('enrollment_requests')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'pending')
      .maybeSingle(),
  ])

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
    pendingRequest: pendingReq || null,
  }
}
