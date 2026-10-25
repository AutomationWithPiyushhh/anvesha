import { createAdminClient } from '@/lib/supabase/admin'
import { Course, Profile } from '@/types'

export interface AdminCourseItem extends Course {
  lessonCount: number
  enrolledCount: number
}

export interface AdminVideoItem {
  id: string
  course_id: string
  title: string
  bunny_video_id: string
  order: number
  duration: number
  created_at: string
}

export interface AdminDeviceSession {
  device_id: string
  last_active: string
  user_agent: string | null
  playing_video_id: string | null
  playback_started_at: string | null
}

export interface AdminStudentItem extends Profile {
  enrollments: {
    course_id: string
    course_title: string
    granted_at: string
  }[]
  sessions: AdminDeviceSession[]
}

export async function getAdminStats() {
  const adminSupabase = createAdminClient()

  const [
    { count: studentCount },
    { count: courseCount },
    { count: videoCount },
    { count: enrollmentCount },
    { count: sessionCount },
  ] = await Promise.all([
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    adminSupabase.from('courses').select('*', { count: 'exact', head: true }),
    adminSupabase.from('videos').select('*', { count: 'exact', head: true }),
    adminSupabase.from('enrollments').select('*', { count: 'exact', head: true }),
    adminSupabase.from('sessions').select('*', { count: 'exact', head: true }),
  ])

  return {
    studentCount: studentCount || 0,
    courseCount: courseCount || 0,
    videoCount: videoCount || 0,
    enrollmentCount: enrollmentCount || 0,
    deviceSessionCount: sessionCount || 0,
  }
}

export async function getAdminCourses(): Promise<AdminCourseItem[]> {
  const adminSupabase = createAdminClient()

  const { data: courses, error } = await adminSupabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !courses) return []

  // Get lesson counts and enrollment counts
  const courseIds = courses.map((c) => c.id)

  const [{ data: videos }, { data: enrollments }] = await Promise.all([
    adminSupabase.from('videos').select('id, course_id').in('course_id', courseIds),
    adminSupabase.from('enrollments').select('user_id, course_id').in('course_id', courseIds),
  ])

  const lessonCountMap = new Map<string, number>()
  videos?.forEach((v) => {
    lessonCountMap.set(v.course_id, (lessonCountMap.get(v.course_id) || 0) + 1)
  })

  const enrollCountMap = new Map<string, number>()
  enrollments?.forEach((e) => {
    enrollCountMap.set(e.course_id, (enrollCountMap.get(e.course_id) || 0) + 1)
  })

  return courses.map((course) => ({
    ...course,
    lessonCount: lessonCountMap.get(course.id) || 0,
    enrolledCount: enrollCountMap.get(course.id) || 0,
  }))
}

export async function getCourseWithAdminLessons(courseId: string) {
  const adminSupabase = createAdminClient()

  const [{ data: course, error: courseError }, { data: videos }] =
    await Promise.all([
      adminSupabase.from('courses').select('*').eq('id', courseId).single(),
      adminSupabase
        .from('videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true }),
    ])

  if (courseError || !course) return null

  return {
    course,
    videos: (videos || []) as AdminVideoItem[],
  }
}

export async function getAdminStudents(): Promise<AdminStudentItem[]> {
  const adminSupabase = createAdminClient()

  // Fetch all profiles
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (!profiles) return []

  // Fetch enrollments with course titles
  const { data: enrollments } = await adminSupabase
    .from('enrollments')
    .select('user_id, course_id, granted_at, courses(title)')

  // Fetch active sessions
  const { data: sessions } = await adminSupabase
    .from('sessions')
    .select('user_id, device_id, last_active, user_agent, playing_video_id, playback_started_at')
    .order('last_active', { ascending: false })

  const enrollmentsMap = new Map<
    string,
    { course_id: string; course_title: string; granted_at: string }[]
  >()

  enrollments?.forEach((e: { user_id: string; course_id: string; granted_at: string; courses: { title: string } | null }) => {
    const list = enrollmentsMap.get(e.user_id) || []
    list.push({
      course_id: e.course_id,
      course_title: e.courses?.title || 'Unknown Course',
      granted_at: e.granted_at,
    })
    enrollmentsMap.set(e.user_id, list)
  })

  const sessionsMap = new Map<string, AdminDeviceSession[]>()
  sessions?.forEach((s) => {
    const list = sessionsMap.get(s.user_id) || []
    list.push({
      device_id: s.device_id,
      last_active: s.last_active,
      user_agent: s.user_agent,
      playing_video_id: s.playing_video_id,
      playback_started_at: s.playback_started_at,
    })
    sessionsMap.set(s.user_id, list)
  })

  return profiles.map((p) => ({
    ...p,
    enrollments: enrollmentsMap.get(p.id) || [],
    sessions: sessionsMap.get(p.id) || [],
  }))
}
