import { z } from 'zod'

export const videoSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  title: z.string().min(2, 'Title must be at least 2 characters'),
  bunny_video_id: z.string().min(5, 'Bunny Video ID is required'),
  order: z.number().int().min(1, 'Order must be at least 1'),
  duration: z.number().int().min(0, 'Duration must be positive in seconds').default(0),
})

export type VideoInput = z.infer<typeof videoSchema>
