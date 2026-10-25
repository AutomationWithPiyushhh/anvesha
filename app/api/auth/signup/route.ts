import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signupSchema } from '@/lib/validations/auth'
import { registerDevice } from '@/lib/auth/device'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create student account' },
        { status: 400 }
      )
    }

    // Auto-register current device for the newly created user
    const userAgent = request.headers.get('user-agent')
    await registerDevice(data.user.id, userAgent)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      redirect: '/dashboard',
    })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected signup error occurred' },
      { status: 500 }
    )
  }
}
