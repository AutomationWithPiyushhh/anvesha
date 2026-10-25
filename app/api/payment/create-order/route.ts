import { NextRequest, NextResponse } from 'next/server'
import { createRazorpayOrder } from '@/lib/payment/razorpay'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 })
    }

    const { courseId, amount } = await req.json()
    if (!courseId && !amount) {
      return NextResponse.json({ error: 'Course ID or amount is required' }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({
        configured: false,
        error: 'Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.',
      })
    }

    let finalAmountInPaise = 499900
    let courseTitle = 'Engineering Track'

    if (courseId) {
      const adminSupabase = createAdminClient()
      const { data: courseRaw, error: courseError } = await adminSupabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError || !courseRaw) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      const course = courseRaw as { id: string; title: string; price_inr?: number }
      courseTitle = course.title

      if (typeof course.price_inr === 'number' && course.price_inr <= 0) {
        return NextResponse.json({
          configured: false,
          error: 'This course is free. Please click "Unlock Instant Free Access" to enroll instantly.',
        })
      }

      finalAmountInPaise = Math.max((course.price_inr || 4999) * 100, 100)
    } else if (amount) {
      finalAmountInPaise = Math.max(Number(amount), 100)
    }

    const order = await createRazorpayOrder({
      amount: finalAmountInPaise,
      currency: 'INR',
      receipt: `anv_${profile.id.slice(0, 6)}_${(courseId || 'custom').slice(0, 6)}`,
      notes: {
        userId: profile.id,
        userEmail: profile.email,
        courseId: courseId || '',
        courseTitle,
      },
    })

    return NextResponse.json({
      configured: true,
      order_id: order.order_id,
      orderId: order.order_id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      courseTitle,
      userName: profile.name,
      userEmail: profile.email,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create order'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
