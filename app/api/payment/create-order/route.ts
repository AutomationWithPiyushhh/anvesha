import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 })
    }

    const { courseId } = await req.json()
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { data: course, error: courseError } = await adminSupabase
      .from('courses')
      .select('id, title, price_inr')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({
        configured: false,
        error: 'Razorpay keys not configured in .env.local. Please use Manual UPI Request or add RAZORPAY_KEY_ID.',
      })
    }

    // Amount in paise (1 INR = 100 paise). Default to 4999 if 0.
    const amountInPaise = Math.max((course.price_inr || 4999) * 100, 100)

    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `anv_${profile.id.slice(0, 6)}_${course.id.slice(0, 6)}`,
        notes: {
          userId: profile.id,
          userEmail: profile.email,
          courseId: course.id,
          courseTitle: course.title,
        },
      }),
    })

    if (!orderRes.ok) {
      const errText = await orderRes.text()
      return NextResponse.json(
        { error: `Razorpay Order Error: ${errText}` },
        { status: orderRes.status }
      )
    }

    const orderData = await orderRes.json()

    return NextResponse.json({
      configured: true,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
      courseTitle: course.title,
      userName: profile.name,
      userEmail: profile.email,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create order'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
