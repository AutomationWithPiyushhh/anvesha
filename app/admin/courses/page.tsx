import { getAdminCourses } from '@/lib/admin/queries'
import { CoursesManager } from '@/components/admin/CoursesManager'

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses()

  return <CoursesManager initialCourses={courses} />
}
