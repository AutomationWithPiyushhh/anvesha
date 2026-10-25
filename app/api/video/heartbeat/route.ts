import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDeviceId } from '@/lib/auth/device'
import { z } from 'zod'

const heartbeatSchema = z.object({
  videoId: z.string().uuid('Invalid video ID format').optional(),
  playbackStartedAt: z.string().optional(),
})

/**
 * POST /api/video/heartbeat
 * Sent by the active video player every ~30s.
 * Enforces: Single active playback session per user account.
 * Rule: Only stop a session if a NEWER playback session for the same user has last_active within 90s.
 * A stopped player can restart anytime by requesting a fresh token.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deviceId = await getDeviceId()
    if (!deviceId) {
      return NextResponse.json({ error: 'Missing device cookie' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = heartbeatSchema.safeParse(body)
    const clientPlaybackStartedAt = parsed.success ? parsed.data.playbackStartedAt : undefined

    const adminClient = createAdminClient()

    // 1. Fetch current session
    const { data: currentSession } = await adminClient
      .from('sessions')
      .select('device_id, playback_started_at, last_active')
      .eq('user_id', user.id)
      .eq('device_id', deviceId)
      .maybeSingle()

    if (!currentSession) {
      return NextResponse.json(
        {
          status: 'stopped',
          reason: 'SESSION_NOT_FOUND',
          message: 'Device session not found. Please log in again.',
        },
        { status: 403 }
      )
    }

    // Determine current playback start timestamp
    const currentStart = clientPlaybackStartedAt || currentSession.playback_started_at

    // 2. Check if a NEWER playback session on another device is active within 90 seconds
    const ninetySecondsAgo = new Date(Date.now() - 90 * 1000).toISOString()
    const { data: otherSessions } = await adminClient
      .from('sessions')
      .select('device_id, playback_started_at, last_active')
      .eq('user_id', user.id)
      .neq('device_id', deviceId)
      .gt('last_active', ninetySecondsAgo)

    if (otherSessions && otherSessions.length > 0 && currentStart) {
      const hasNewerActiveSession = otherSessions.some((s) => {
        if (!s.playback_started_at) return false
        return new Date(s.playback_started_at) > new Date(currentStart)
      })

      if (hasNewerActiveSession) {
        return NextResponse.json({
          status: 'stopped',
          reason: 'ANOTHER_DEVICE_PLAYING',
          message: 'Playback stopped: another session started on another device.',
        })
      }
    }

    // 3. Current session remains active: update last_active timestamp
    const nowIso = new Date().toISOString()
    await adminClient
      .from('sessions')
      .update({
        last_active: nowIso,
      })
      .eq('user_id', user.id)
      .eq('device_id', deviceId)

    return NextResponse.json({
      status: 'active',
      lastActive: nowIso,
    })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected heartbeat error occurred' },
      { status: 500 }
    )
  }
}
