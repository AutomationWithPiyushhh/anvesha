import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDeviceId } from '@/lib/auth/device'
import { generateBunnyToken } from '@/lib/bunny/token'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const tokenRequestSchema = z.object({
  videoId: z.string().uuid('Invalid video ID format'),
})

/**
 * POST /api/video/token
 * Generates an official Bunny CDN path-based directory token for authorized video playback.
 * Enforces:
 * 1. Authentication (401 if unauthenticated)
 * 2. Rate limiting (429 if exceeded, max 10/min)
 * 3. Server-set httpOnly deviceId verification
 * 4. Course enrollment verification (403 if not enrolled and not admin)
 * 5. Session playback initialization (newest playback starts with current timestamp)
 * Never logs raw tokens or signed URLs.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify user session
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Rate limit (max 10 token requests / minute)
    const rateLimit = await checkRateLimit(`token:${user.id}`, 10, 60)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before requesting another stream.' },
        { status: 429 }
      )
    }

    // 3. Extract deviceId strictly from server-set httpOnly cookie
    const deviceId = await getDeviceId()
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device registration cookie missing. Please sign in again.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = tokenRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid video request payload' },
        { status: 400 }
      )
    }

    const { videoId } = parsed.data
    const adminClient = createAdminClient()

    // 4. Verify device is registered in sessions
    const { data: sessionRecord } = await adminClient
      .from('sessions')
      .select('device_id')
      .eq('user_id', user.id)
      .eq('device_id', deviceId)
      .maybeSingle()

    if (!sessionRecord) {
      return NextResponse.json(
        { error: 'Device is not registered. Please log in from a registered device.' },
        { status: 403 }
      )
    }

    // 5. Fetch video record (reads bunny_video_id server-side only)
    const { data: video, error: videoError } = await adminClient
      .from('videos')
      .select('id, course_id, title, bunny_video_id, duration')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video module not found' }, { status: 404 })
    }

    // 6. Verify enrollment (admins bypass)
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin) {
      const { data: enrollment } = await adminClient
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('course_id', video.course_id)
        .maybeSingle()

      if (!enrollment) {
        return NextResponse.json(
          { error: 'You are not enrolled in the course for this video.' },
          { status: 403 }
        )
      }
    }

    // 7. Update current session: mark this playback as newest
    const nowIso = new Date().toISOString()
    await adminClient
      .from('sessions')
      .update({
        playing_video_id: video.id,
        playback_started_at: nowIso,
        last_active: nowIso,
      })
      .eq('user_id', user.id)
      .eq('device_id', deviceId)

    // 8. Generate Bunny CDN path-based directory token
    const ttlSeconds = parseInt(process.env.SIGNED_URL_TTL_SECONDS || '3600', 10)

    // IP locking can be empty or set depending on network topology; we use default directory token
    const { signedUrl, expires } = generateBunnyToken({
      bunnyVideoId: video.bunny_video_id,
      expiresInSeconds: ttlSeconds,
      userIp: '', // Avoid breaking mobile networks with dynamic IP shifting
    })

    // Return the authorized HLS playback URL
    return NextResponse.json({
      success: true,
      playbackUrl: signedUrl,
      expires,
      title: video.title,
      duration: video.duration,
      playbackStartedAt: nowIso,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to authorize video playback' },
      { status: 500 }
    )
  }
}
