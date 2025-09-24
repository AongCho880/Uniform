// uniform-frontend/src/routes/admin/admins.tsx

import AdminProtectedRoutes from '@/utils/AdminProtectedRoutes'
import { ROLES } from '@/utils/role'
import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminManagement } from '@/components/admin/AdminManagement'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/admins')({
  component: () => (
    <AdminProtectedRoutes role={ROLES.ADMIN}>
      <RouteComponent />
    </AdminProtectedRoutes>
  ),
})

function RouteComponent() {
  const navigate = useNavigate()
  const search = Route.useSearch() as Partial<{ create: '0' | '1' }>
  const openCreate = search.create === '1'

  const onTabChange = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        navigate({ to: '/admin/dashboard' })
        break
      case 'institutions':
        navigate({ to: '/admin/institutions' })
        break
      case 'admins':
        navigate({ to: '/admin/admins' })
        break
      case 'visualization':
        navigate({ to: '/admin/visualization' })
        break
      default:
        navigate({ to: '/admin/dashboard' })
    }
  }

  return (
    <AdminLayout activeTab={'admins'} onTabChange={onTabChange}>
      <AdminManagement openCreate={openCreate} />
    </AdminLayout>
  )
}
