'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

const CourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  thumbnail: z.string().min(1, 'Thumbnail URL is required'),
})

const LessonSchema = z.object({
  title: z.string().min(2, 'Lesson title must be at least 2 characters'),
  bunny_video_id: z.string().min(5, 'Bunny Video ID must be valid'),
  order: z.coerce.number().int().min(1, 'Order must be 1 or higher'),
  duration: z.coerce.number().int().min(0, 'Duration in seconds must be 0 or higher'),
})

const EnrollSchema = z.object({
  email: z.string().email('Please enter a valid student email'),
  courseId: z.string().uuid('Invalid course ID'),
})

async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: Administrator access required')
  }
  return profile
}

// ================= COURSE ACTIONS =================

export async function createCourseAction(data: {
  title: string
  description: string
  thumbnail: string
}) {
  try {
    await requireAdmin()
    const validated = CourseSchema.parse(data)
    const adminSupabase = createAdminClient()

    const { data: newCourse, error } = await adminSupabase
      .from('courses')
      .insert({
        title: validated.title.trim(),
        description: validated.description.trim(),
        thumbnail: validated.thumbnail.trim(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/courses')
    revalidatePath('/dashboard')
    return { success: true, course: newCourse }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create course'
    return { success: false, error: message }
  }
}

export async function updateCourseAction(
  courseId: string,
  data: {
    title: string
    description: string
    thumbnail: string
  }
) {
  try {
    await requireAdmin()
    const validated = CourseSchema.parse(data)
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('courses')
      .update({
        title: validated.title.trim(),
        description: validated.description.trim(),
        thumbnail: validated.thumbnail.trim(),
      })
      .eq('id', courseId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath(`/courses/${courseId}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update course'
    return { success: false, error: message }
  }
}

export async function deleteCourseAction(courseId: string) {
  try {
    await requireAdmin()
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase.from('courses').delete().eq('id', courseId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/courses')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete course'
    return { success: false, error: message }
  }
}

// ================= LESSON ACTIONS =================

export async function createLessonAction(
  courseId: string,
  data: {
    title: string
    bunny_video_id: string
    order: number
    duration: number
  }
) {
  try {
    await requireAdmin()
    const validated = LessonSchema.parse(data)
    const adminSupabase = createAdminClient()

    const { data: newVideo, error } = await adminSupabase
      .from('videos')
      .insert({
        course_id: courseId,
        title: validated.title.trim(),
        bunny_video_id: validated.bunny_video_id.trim(),
        order: validated.order,
        duration: validated.duration,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/courses/${courseId}/lessons`)
    revalidatePath(`/courses/${courseId}`)
    return { success: true, video: newVideo }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create lesson'
    return { success: false, error: message }
  }
}

export async function updateLessonAction(
  lessonId: string,
  courseId: string,
  data: {
    title: string
    bunny_video_id: string
    order: number
    duration: number
  }
) {
  try {
    await requireAdmin()
    const validated = LessonSchema.parse(data)
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('videos')
      .update({
        title: validated.title.trim(),
        bunny_video_id: validated.bunny_video_id.trim(),
        order: validated.order,
        duration: validated.duration,
      })
      .eq('id', lessonId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/courses/${courseId}/lessons`)
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update lesson'
    return { success: false, error: message }
  }
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
  try {
    await requireAdmin()
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase.from('videos').delete().eq('id', lessonId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/admin/courses/${courseId}/lessons`)
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete lesson'
    return { success: false, error: message }
  }
}

export async function reorderLessonsAction(
  courseId: string,
  reorderedIds: { id: string; order: number }[]
) {
  try {
    await requireAdmin()
    const adminSupabase = createAdminClient()

    // Update order for each lesson
    const updates = reorderedIds.map(({ id, order }) =>
      adminSupabase.from('videos').update({ order }).eq('id', id)
    )

    await Promise.all(updates)

    revalidatePath(`/admin/courses/${courseId}/lessons`)
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reorder lessons'
    return { success: false, error: message }
  }
}

// ================= STUDENT & ENROLLMENT ACTIONS =================

export async function enrollStudentAction(email: string, courseId: string) {
  try {
    await requireAdmin()
    const validated = EnrollSchema.parse({ email, courseId })
    const adminSupabase = createAdminClient()

    // Look up student by email in profiles
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', validated.email.trim().toLowerCase())
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: `No registered account found with email "${validated.email}". The student must register first.`,
      }
    }

    // Check existing enrollment
    const { data: existing } = await adminSupabase
      .from('enrollments')
      .select('user_id')
      .eq('user_id', profile.id)
      .eq('course_id', validated.courseId)
      .single()

    if (existing) {
      return {
        success: false,
        error: `Student ${profile.name} (${profile.email}) is already enrolled in this course.`,
      }
    }

    // Insert enrollment
    const { error: enrollError } = await adminSupabase.from('enrollments').insert({
      user_id: profile.id,
      course_id: validated.courseId,
    })

    if (enrollError) {
      return { success: false, error: enrollError.message }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/courses')
    revalidatePath('/dashboard')
    return {
      success: true,
      message: `Enrolled ${profile.name} (${profile.email}) successfully.`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to enroll student'
    return { success: false, error: message }
  }
}

export async function unenrollStudentAction(userId: string, courseId: string) {
  try {
    await requireAdmin()
    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('enrollments')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/courses')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to unenroll student'
    return { success: false, error: message }
  }
}

export async function resetStudentDevicesAction(userId: string) {
  try {
    await requireAdmin()
    const adminSupabase = createAdminClient()

    // Delete all registered sessions for this student
    const { error } = await adminSupabase.from('sessions').delete().eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/students')
    return {
      success: true,
      message: 'All registered device sessions have been cleared. Student can now register up to 2 devices.',
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reset student devices'
    return { success: false, error: message }
  }
}
