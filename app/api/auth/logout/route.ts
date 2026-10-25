import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    return NextResponse.redirect(new URL('/login', request.url), {
      status: 303,
    })
  } catch {
    return NextResponse.redirect(new URL('/login', request.url), {
      status: 303,
    })
  }
}
