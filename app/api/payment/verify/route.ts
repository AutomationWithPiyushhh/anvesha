import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/payment/razorpay'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 })
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
      return NextResponse.json({ error: 'Missing payment verification parameters' }, { status: 400 })
    }

    // 1. Verify HMAC SHA256 Signature
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment signature verification failed. Please contact support.' },
        { status: 400 }
      )
    }

    // 2. Grant Enrollment in Database
    const adminSupabase = createAdminClient()
    const { error: enrollError } = await adminSupabase
      .from('enrollments')
      .upsert(
        {
          user_id: profile.id,
          course_id: courseId,
          granted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, course_id' }
      )

    if (enrollError) {
      return NextResponse.json({ error: enrollError.message }, { status: 500 })
    }

    // 3. Mark any pending request as approved
    await adminSupabase
      .from('enrollment_requests')
      .update({
        status: 'approved',
        payment_method: 'razorpay',
        transaction_ref: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)
      .eq('course_id', courseId)

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Verification failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
