import { getAdminEnrollmentRequests } from '@/lib/enrollment/actions'
import { RequestsManager } from '@/components/admin/RequestsManager'

export default async function AdminRequestsPage() {
  const requests = await getAdminEnrollmentRequests()

  return <RequestsManager initialRequests={requests} />
}
