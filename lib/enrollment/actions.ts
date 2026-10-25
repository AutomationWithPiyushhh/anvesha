'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface EnrollmentRequestItem {
  id: string
  user_id: string
  course_id: string
  status: 'pending' | 'approved' | 'rejected'
  payment_method: string
  transaction_ref: string | null
  notes: string | null
  created_at: string
  updated_at: string
  user?: {
    name: string
    email: string
  }
  course?: {
    title: string
    price_inr: number
  }
}

/**
 * Student submits a request to enroll in a course (offline UPI or approval)
 */
export async function submitEnrollmentRequestAction(data: {
  courseId: string
  paymentMethod?: string
  transactionRef?: string
  notes?: string
}) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return { success: false, error: 'Unauthorized: Please log in' }
    }

    const adminSupabase = createAdminClient()

    // 1. Check if already enrolled
    const { data: existingEnrollment } = await adminSupabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', profile.id)
      .eq('course_id', data.courseId)
      .maybeSingle()

    if (existingEnrollment) {
      return { success: false, error: 'You are already enrolled in this course.' }
    }

    // 2. Check for existing pending request
    const { data: existingRequest } = await adminSupabase
      .from('enrollment_requests')
      .select('id, status')
      .eq('user_id', profile.id)
      .eq('course_id', data.courseId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return {
        success: false,
        error: 'You already have a pending enrollment request for this course. Your instructor will review it shortly.',
      }
    }

    // 3. Insert new request
    const { data: newReq, error: insertError } = await adminSupabase
      .from('enrollment_requests')
      .insert({
        user_id: profile.id,
        course_id: data.courseId,
        payment_method: data.paymentMethod || 'manual_upi',
        transaction_ref: data.transactionRef?.trim() || null,
        notes: data.notes?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath(`/courses/${data.courseId}`)
    revalidatePath('/dashboard')
    return { success: true, request: newReq }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit enrollment request'
    return { success: false, error: msg }
  }
}

/**
 * Check if the current student has a pending request for a course
 */
export async function getStudentCourseRequest(courseId: string, userId: string) {
  try {
    const supabase = await createClient()
    const { data: request } = await supabase
      .from('enrollment_requests')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return request
  } catch {
    return null
  }
}

/**
 * Admin: Get all pending enrollment requests
 */
export async function getAdminEnrollmentRequests(): Promise<EnrollmentRequestItem[]> {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'admin') {
      return []
    }

    const adminSupabase = createAdminClient()
    const { data: requests, error } = await adminSupabase
      .from('enrollment_requests')
      .select(`
        *,
        user:profiles(name, email),
        course:courses(title, price_inr)
      `)
      .order('created_at', { ascending: false })

    if (error || !requests) {
      return []
    }

    return requests as unknown as EnrollmentRequestItem[]
  } catch {
    return []
  }
}

/**
 * Admin: 1-click Approve enrollment request
 */
export async function approveEnrollmentRequestAction(requestId: string) {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin role required' }
    }

    const adminSupabase = createAdminClient()

    // 1. Fetch request details
    const { data: req, error: reqError } = await adminSupabase
      .from('enrollment_requests')
      .select('id, user_id, course_id, status')
      .eq('id', requestId)
      .single()

    if (reqError || !req) {
      return { success: false, error: 'Request not found' }
    }

    // 2. Grant enrollment
    const { error: enrollError } = await adminSupabase
      .from('enrollments')
      .upsert(
        {
          user_id: req.user_id,
          course_id: req.course_id,
          granted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, course_id' }
      )

    if (enrollError) {
      return { success: false, error: enrollError.message }
    }

    // 3. Mark request as approved
    await adminSupabase
      .from('enrollment_requests')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    revalidatePath('/admin/requests')
    revalidatePath('/admin/students')
    revalidatePath('/dashboard')
    revalidatePath(`/courses/${req.course_id}`)

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve request'
    return { success: false, error: msg }
  }
}

/**
 * Admin: Reject enrollment request
 */
export async function rejectEnrollmentRequestAction(requestId: string) {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin role required' }
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase
      .from('enrollment_requests')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/requests')
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reject request'
    return { success: false, error: msg }
  }
}
