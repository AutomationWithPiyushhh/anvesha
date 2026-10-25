import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Upsert into watch_progress using the authenticated client.
    // Note: Database RLS verifies that the user is actively enrolled in the course that owns videoId.
    const { data, error: dbError } = await supabase
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
        { error: 'Failed to record watch progress. Verify course enrollment.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      progress: data,
    })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving watch progress' },
      { status: 500 }
    )
  }
}
