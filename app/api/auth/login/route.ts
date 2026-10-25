import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/auth'
import { registerDevice } from '@/lib/auth/device'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input credentials' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Enforce device registration (reads/sets httpOnly anvesha_device_id cookie, max 2 devices)
    const userAgent = request.headers.get('user-agent')
    const deviceResult = await registerDevice(data.user.id, userAgent)

    if (!deviceResult.success) {
      // If device limit reached, terminate the auth session
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          error: deviceResult.message,
          code: deviceResult.error,
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      redirect: '/dashboard',
    })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred' },
      { status: 500 }
    )
  }
}
