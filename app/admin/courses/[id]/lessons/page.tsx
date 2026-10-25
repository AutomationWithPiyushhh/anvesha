import { notFound } from 'next/navigation'
import { getCourseWithAdminLessons } from '@/lib/admin/queries'
import { LessonsManager } from '@/components/admin/LessonsManager'

interface AdminCourseLessonsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminCourseLessonsPage({
  params,
}: AdminCourseLessonsPageProps) {
  const { id } = await params
  const data = await getCourseWithAdminLessons(id)

  if (!data) {
    notFound()
  }

  return <LessonsManager course={data.course} initialVideos={data.videos} />
}
