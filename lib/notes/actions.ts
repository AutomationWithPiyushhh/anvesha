'use server'

import { z } from 'zod'
import { getCurrentProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

const NoteSchema = z.object({
  videoId: z.string().uuid(),
  content: z.string().min(1, 'Note content cannot be empty'),
  timestampSeconds: z.coerce.number().int().min(0),
})

export interface StudentNoteItem {
  id: string
  user_id: string
  video_id: string
  content: string
  timestamp_seconds: number
  created_at: string
  updated_at: string
}

export async function createStudentNoteAction(data: {
  videoId: string
  content: string
  timestampSeconds: number
}) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return { success: false, error: 'Unauthorized: Please log in' }
    }

    const validated = NoteSchema.parse(data)
    const supabase = await createClient()

    const { data: newNote, error } = await supabase
      .from('student_notes')
      .insert({
        user_id: profile.id,
        video_id: validated.videoId,
        content: validated.content.trim(),
        timestamp_seconds: validated.timestampSeconds,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, note: newNote as StudentNoteItem }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save note'
    return { success: false, error: message }
  }
}

export async function updateStudentNoteAction(noteId: string, content: string) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return { success: false, error: 'Unauthorized: Please log in' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('student_notes')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .eq('user_id', profile.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update note'
    return { success: false, error: message }
  }
}

export async function deleteStudentNoteAction(noteId: string) {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      return { success: false, error: 'Unauthorized: Please log in' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('student_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', profile.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete note'
    return { success: false, error: message }
  }
}

export async function getStudentNotes(videoId: string): Promise<StudentNoteItem[]> {
  try {
    const supabase = await createClient()
    const { data: notes, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('video_id', videoId)
      .order('timestamp_seconds', { ascending: true })

    if (error) return []
    return (notes || []) as StudentNoteItem[]
  } catch {
    return []
  }
}

