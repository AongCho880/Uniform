// uniform-frontend/src/routes/admin/institutions.index.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { InstitutionManagement } from '@/components/admin/InstitutionManagement'

export const Route = createFileRoute('/admin/institutions/')({
  component: () => <RouteComponent />,
})

function RouteComponent() {
  const navigate = useNavigate()
  const search = Route.useSearch() as Partial<{
    page: number
    q: string
    sortField: 'name' | 'createdAt'
    sortDirection: 'asc' | 'desc'
    create: '0' | '1'
  }>

  const page = search.page ?? 1
  const q = search.q ?? ''
  const sortField = search.sortField ?? 'createdAt'
  const sortDirection = search.sortDirection ?? 'desc'
  const openCreate = search.create === '1'

  const updateSearch = (patch: Partial<typeof search>) => {
    navigate({
      to: '/admin/institutions',
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
  }

  return (
    <InstitutionManagement
      page={page}
      search={q}
      sortFieldProp={sortField}
      sortDirectionProp={sortDirection}
      openCreate={openCreate}
      onPageChange={(p) => updateSearch({ page: p })}
      onSearchChange={(s) => updateSearch({ q: s, page: 1 })}
      onSortChange={(f, d) => updateSearch({ sortField: f, sortDirection: d, page: 1 })}
    />
  )
}
