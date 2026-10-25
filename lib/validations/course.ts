import { z } from 'zod'

export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  thumbnail: z.string().url('Thumbnail must be a valid URL'),
})

export type CourseInput = z.infer<typeof courseSchema>
