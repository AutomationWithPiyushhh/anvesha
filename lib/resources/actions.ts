'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getCurrentProfile } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ResourceSchema = z.object({
  title: z.string().min(2, 'Resource title must be at least 2 characters'),
  url: z.string().url('Please provide a valid URL (e.g. https://github.com/...)'),
})

export async function addLessonResourceAction(
  videoId: string,
  data: { title: string; url: string }
) {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required' }
    }

    const validated = ResourceSchema.parse(data)
    const adminSupabase = createAdminClient()

    const { data: newResource, error } = await adminSupabase
      .from('lesson_resources')
      .insert({
        video_id: videoId,
        title: validated.title.trim(),
        url: validated.url.trim(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/watch/${videoId}`)
    return { success: true, resource: newResource }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add lesson resource'
    return { success: false, error: message }
  }
}

export async function deleteLessonResourceAction(resourceId: string, videoId: string) {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required' }
    }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('lesson_resources')
      .delete()
      .eq('id', resourceId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/watch/${videoId}`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete resource'
    return { success: false, error: message }
  }
}

export async function getLessonResources(videoId: string) {
  try {
    const supabase = await createClient()
    const { data: resources, error } = await supabase
      .from('lesson_resources')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true })

    if (error) return []
    return resources || []
  } catch {
    return []
  }
}

