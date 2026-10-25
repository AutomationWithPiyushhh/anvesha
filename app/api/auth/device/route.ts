import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registerDevice } from '@/lib/auth/device'

/**
 * POST /api/auth/device
 * Server route to register or verify the device ID (from server-set httpOnly cookie).
 * Enforces maximum 2 devices per account. If a 3rd device is attempted, signs the user out immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userAgent = request.headers.get('user-agent')
    const result = await registerDevice(user.id, userAgent)

    if (!result.success) {
      // Sign the user out immediately if device limit is exceeded
      await supabase.auth.signOut()

      return NextResponse.json(
        {
          error: result.message,
          code: result.error,
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      deviceId: result.deviceId,
    })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred while verifying your device' },
      { status: 500 }
    )
  }
}
