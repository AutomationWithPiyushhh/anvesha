import { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Video = Database['public']['Tables']['videos']['Row']
export type StudentVideo = Database['public']['Views']['student_videos']['Row']
export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type WatchProgress = Database['public']['Tables']['watch_progress']['Row']
export type RateLimit = Database['public']['Tables']['rate_limits']['Row']

export interface CourseWithProgress extends Course {
  progressPercentage: number
  totalLessons: number
  completedLessons: number
}

export interface VideoWithProgress extends StudentVideo {
  watched: boolean
  lastPositionSeconds: number
}
