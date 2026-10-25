import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth/session'

export async function GET() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isConfigured = Boolean(
    process.env.BUNNY_API_KEY && process.env.BUNNY_LIBRARY_ID
  )

  return NextResponse.json({
    configured: isConfigured,
    libraryId: process.env.BUNNY_LIBRARY_ID || null,
  })
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.BUNNY_API_KEY
    const libraryId = process.env.BUNNY_LIBRARY_ID

    if (!apiKey || !libraryId) {
      return NextResponse.json(
        {
          error:
            'Bunny API Key not configured. Please add BUNNY_API_KEY to .env.local (from Bunny.net -> Stream -> Video Libraries -> API).',
        },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || file?.name || 'Untitled Lesson'

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // 1. Create Video Object in Bunny Stream
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ title }),
      }
    )

    if (!createRes.ok) {
      const errText = await createRes.text()
      return NextResponse.json(
        { error: `Bunny Video Creation Failed: ${errText}` },
        { status: createRes.status }
      )
    }

    const createData = (await createRes.json()) as { guid: string }
    const videoGuid = createData.guid

    // 2. Upload video file content directly to Bunny
    const arrayBuffer = await file.arrayBuffer()
    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: Buffer.from(arrayBuffer),
      }
    )

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text()
      return NextResponse.json(
        { error: `Bunny Video Upload Failed: ${uploadErr}` },
        { status: uploadRes.status }
      )
    }

    return NextResponse.json({
      success: true,
      guid: videoGuid,
      title,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
