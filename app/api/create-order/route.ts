import { NextRequest, NextResponse } from 'next/server'
import { createRazorpayOrder } from '@/lib/payment/razorpay'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    let { amount, currency = 'INR', receipt, courseId } = body

    let notes: Record<string, string> = body.notes || {}
    let courseTitle = 'Engineering Track'

    // If courseId is provided, enrich order with student profile & course details
    const profile = await getCurrentProfile().catch(() => null)
    if (courseId) {
      const adminSupabase = createAdminClient()
      const { data: courseRaw } = await adminSupabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseRaw) {
        courseTitle = courseRaw.title
        // If amount was not explicitly provided in paise, calculate from course.price_inr
        if (!amount) {
          const priceInr = typeof courseRaw.price_inr === 'number' ? courseRaw.price_inr : 4999
          if (priceInr <= 0) {
            return NextResponse.json(
              { error: 'This course is free and does not require online payment.' },
              { status: 400 }
            )
          }
          amount = priceInr * 100
        }
      }

      if (profile) {
        notes = {
          ...notes,
          userId: profile.id,
          userEmail: profile.email,
          courseId,
          courseTitle,
        }
        if (!receipt) {
          receipt = `anv_${profile.id.slice(0, 6)}_${courseId.slice(0, 6)}`
        }
      }
    }

    // Minimum amount validation: 100 paise (₹1.00)
    const amountInPaise = Number(amount)
    if (isNaN(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        { error: 'Amount must be a valid number of at least 100 paise (₹1.00).' },
        { status: 400 }
      )
    }

    const order = await createRazorpayOrder({
      amount: amountInPaise,
      currency,
      receipt,
      notes,
    })

    return NextResponse.json({
      order_id: order.order_id,
      orderId: order.order_id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      courseTitle,
      userName: profile?.name,
      userEmail: profile?.email,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create Razorpay order'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
