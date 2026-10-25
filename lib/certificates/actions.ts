'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CertificateDetails {
  id: string
  certificate_number: string
  issued_at: string
  student_name: string
  student_email: string
  course_id: string
  course_title: string
  course_description: string
}

export async function getCertificate(courseId: string, userId: string) {
  try {
    const supabase = await createClient()
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return null
    return cert
  } catch {
    return null
  }
}

export async function getCertificateById(certificateId: string): Promise<CertificateDetails | null> {
  try {
    const supabase = await createClient()
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single()

    if (certError || !cert) return null

    // Fetch student profile & course info
    const [{ data: profile }, { data: course }] = await Promise.all([
      supabase.from('profiles').select('name, email').eq('id', cert.user_id).single(),
      supabase.from('courses').select('id, title, description').eq('id', cert.course_id).single(),
    ])

    if (!profile || !course) return null

    return {
      id: cert.id,
      certificate_number: cert.certificate_number,
      issued_at: cert.issued_at,
      student_name: profile.name || profile.email.split('@')[0],
      student_email: profile.email,
      course_id: course.id,
      course_title: course.title,
      course_description: course.description,
    }
  } catch {
    return null
  }
}

export async function claimCertificateAction(courseId: string) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return { success: false, error: 'Unauthorized: Please log in' }
    }

    const supabase = await createClient()

    // 1. Check existing certificate
    const { data: existing } = await supabase
      .from('certificates')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (existing) {
      return { success: true, certificate: existing }
    }

    // 2. Fetch all lesson IDs for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('student_videos')
      .select('id')
      .eq('course_id', courseId)

    if (lessonsError || !lessons || lessons.length === 0) {
      return { success: false, error: 'No lessons found for this course.' }
    }

    const lessonIds = lessons.map((l) => l.id)

    // 3. Count completed lessons for this student
    const { data: completedRows, error: progressError } = await supabase
      .from('watch_progress')
      .select('video_id')
      .eq('user_id', profile.id)
      .eq('completed', true)
      .in('video_id', lessonIds)

    if (progressError) {
      return { success: false, error: progressError.message }
    }

    const completedCount = completedRows ? completedRows.length : 0

    // Only allow claiming if 100% completed or admin
    if (completedCount < lessonIds.length && profile.role !== 'admin') {
      return {
        success: false,
        error: `Course is ${Math.round((completedCount / lessonIds.length) * 100)}% complete. Complete all lessons to unlock your certificate.`,
      }
    }

    // 4. Generate unique certificate number
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
    const certNum = `ANV-${new Date().getFullYear()}-${randomHex}`

    const adminSupabase = createAdminClient()
    const { data: newCert, error: insertError } = await adminSupabase
      .from('certificates')
      .insert({
        user_id: profile.id,
        course_id: courseId,
        certificate_number: certNum,
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath(`/courses/${courseId}`)
    return { success: true, certificate: newCert }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to claim certificate'
    return { success: false, error: message }
  }
}
