import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/payment/razorpay'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const orderId = body.razorpay_order_id || body.order_id
    const paymentId = body.razorpay_payment_id || body.payment_id
    const signature = body.razorpay_signature || body.signature
    const courseId = body.courseId

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing required parameters: order_id, payment_id, and signature are required.' },
        { status: 400 }
      )
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature,
    })

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      )
    }

    // If an authenticated user paid for a specific course, grant enrollment
    const profile = await getCurrentProfile().catch(() => null)
    if (profile && courseId) {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('enrollments').upsert(
        {
          user_id: profile.id,
          course_id: courseId,
          granted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, course_id' }
      )

      await adminSupabase
        .from('enrollment_requests')
        .update({
          status: 'approved',
          payment_method: 'razorpay',
          transaction_ref: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.id)
        .eq('course_id', courseId)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: paymentId,
      order_id: orderId,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Payment verification error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
