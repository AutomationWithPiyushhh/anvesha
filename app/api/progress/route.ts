import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const progressSchema = z.object({
  videoId: z.string().uuid('Invalid video ID format'),
  positionSeconds: z.number().int().min(0, 'Position must be positive'),
  completed: z.boolean(),
})

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

    const body = await request.json()
    const parsed = progressSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid progress payload' },
        { status: 400 }
      )
    }

    const { videoId, positionSeconds, completed } = parsed.data
    const adminSupabase = createAdminClient()

    // 1. Verify video and enrollment
    const { data: video } = await adminSupabase
      .from('videos')
      .select('course_id')
      .eq('id', videoId)
      .single()

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin) {
      const { data: enrollment } = await adminSupabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('course_id', video.course_id)
        .maybeSingle()

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Forbidden: You are not enrolled in this course' },
          { status: 403 }
        )
      }
    }

    // 2. Perform upsert safely with admin client
    const { data, error: dbError } = await adminSupabase
      .from('watch_progress')
      .upsert(
        {
          user_id: user.id,
          video_id: videoId,
          position_seconds: positionSeconds,
          completed,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id, video_id',
        }
      )
      .select()
      .maybeSingle()

    if (dbError) {
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      progress: data,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
