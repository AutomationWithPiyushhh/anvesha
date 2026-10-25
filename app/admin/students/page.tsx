import { getAdminStudents, getAdminCourses } from '@/lib/admin/queries'
import { StudentsManager } from '@/components/admin/StudentsManager'

export default async function AdminStudentsPage() {
  const [students, courses] = await Promise.all([
    getAdminStudents(),
    getAdminCourses(),
  ])

  return <StudentsManager initialStudents={students} courses={courses} />
}
