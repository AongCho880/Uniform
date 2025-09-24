// placeholder
// uniform-frontend/src/components/admin/AdminManagement.tsx

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin/adminApi'
import type { Institution, Admin } from '@/types/admin'
import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Eye, EyeOff, AlertCircle, Trash2 } from 'lucide-react'
import axios from 'axios'

interface AdminManagementProps {
  openCreate?: boolean
}

export function AdminManagement({ openCreate = false }: AdminManagementProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number | 'ALL'>(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Create admin form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', institutionId: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Delete confirmation state
  const [isDeleteAdminDialogOpen, setIsDeleteAdminDialogOpen] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null)

  // Data loaders
  const fetchAdmins = useCallback(async (page: number = 1, limit: number | 'ALL' = 10) => {
    try {
      setLoadingAdmins(true)
      let response: { admins: Admin[]; metadata?: { totalPages: number; currentPage: number; currentLimit: number; totalItems: number } };
      if (limit === 'ALL') {
        response = await adminApi.getAdmins()
      } else {
        response = await adminApi.getAdmins({ page, limit })
      }

      setAdmins(response.admins || [])
      if (response.metadata) {
        setTotalPages(response.metadata.totalPages || 1)
        setCurrentPage(response.metadata.currentPage || 1)
        setTotalItems(response.metadata.totalItems || (response.admins?.length ?? 0))
      } else {
        // No pagination metadata when requesting ALL
        setTotalPages(1)
        setCurrentPage(1)
        setTotalItems(response.admins?.length ?? 0)
      }
    } catch (error) {
      toast.error('Failed to load admins')
      console.error('Error fetching admins:', error)
    } finally {
      setLoadingAdmins(false)
    }
  }, [])

  const fetchInstitutions = async () => {
    try {
      const response = await adminApi.getInstitutions()
      const sorted = (response.institutions || []).slice().sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      )
      setInstitutions(sorted)
    } catch (error) {
      toast.error('Failed to load institutions')
      console.error('Error fetching institutions:', error)
    }
  }

  // Effects
  useEffect(() => {
    fetchInstitutions()
  }, [])

  useEffect(() => {
    if (openCreate) {
      setIsCreateDialogOpen(true)
    }
  }, [openCreate])

  useEffect(() => {
    void fetchAdmins(currentPage, itemsPerPage)
  }, [fetchAdmins, currentPage, itemsPerPage])

  const handleCreateAdmin = async () => {
    if (!newAdmin.email.trim() || !newAdmin.password.trim()) {
      toast.error('Email and password are required')
      return
    }
    if (newAdmin.password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      setIsSubmitting(true)
      await adminApi.createAdmin({
        email: newAdmin.email,
        password: newAdmin.password,
        password_confirmation: confirmPassword,
        institutionId: newAdmin.institutionId || undefined,
      })

      toast.success('Admin created successfully')
      setIsCreateDialogOpen(false)
      setNewAdmin({ email: '', password: '', institutionId: '' })
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setPasswordError('')
      // Refresh admin list (show newest on first page)
      setCurrentPage(1)
      await fetchAdmins(1, itemsPerPage)
    } catch (error) {
      toast.error('Failed to create admin')
      console.error('Error creating admin:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-gray-500">Manage institution administrators</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Institution Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                Add a new institution administrator to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <div className="col-span-3 relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">Confirm Password</Label>
                <div className="col-span-3 relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      const v = e.target.value
                      setConfirmPassword(v)
                      setPasswordError(v && newAdmin.password !== v ? 'Passwords do not match' : '')
                    }}
                    aria-invalid={passwordError ? true : false}
                    className={`pr-10 ${passwordError ? 'border-gray-500 focus:ring-gray-500 focus:border-gray-500' : ''}`}
                  />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                  </Button>
                  {passwordError && (<p className="mt-1 text-sm text-gray-700">{passwordError}</p>)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="institution" className="text-right">Institution</Label>
                <Select value={newAdmin.institutionId} onValueChange={(value) => setNewAdmin({ ...newAdmin, institutionId: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((institution) => {
                      const label = institution.shortName && institution.shortName.trim().length > 0
                        ? `${institution.name} (${institution.shortName})`
                        : institution.name
                      return (
                        <SelectItem key={institution.institutionId} value={institution.institutionId}>
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAdmin} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution Admins</CardTitle>
          <CardDescription>View and manage all institution administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              {totalItems === 0 ? 'No results' : (() => {
                const pageSize = itemsPerPage === 'ALL' ? totalItems : itemsPerPage
                const startIdx = itemsPerPage === 'ALL' ? (totalItems > 0 ? 1 : 0) : (pageSize ? (currentPage - 1) * (pageSize as number) + 1 : 0)
                const endIdx = itemsPerPage === 'ALL' ? totalItems : Math.min(totalItems, currentPage * (pageSize as number))
                return <>Showing {startIdx}–{endIdx} of {totalItems} admins</>
              })()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => {
                const parsed = v === 'ALL' ? 'ALL' : parseInt(v)
                setItemsPerPage(parsed as number | 'ALL')
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {loadingAdmins ? (
            <div className="flex justify-center items-center h-24">Loading admins...</div>
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No admins found</h3>
              <p className="text-gray-500">Create the first institution admin to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.adminId}>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.institution?.name ?? '—'}</TableCell>
                    <TableCell>{format(new Date(a.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{a.lastLogin ? format(new Date(a.lastLogin), 'MMM dd, yyyy p') : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="destructive" size="sm" onClick={() => { setAdminToDelete(a); setIsDeleteAdminDialogOpen(true) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {itemsPerPage !== 'ALL' && totalItems > 0 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Admin Confirmation Dialog */}
      <Dialog open={isDeleteAdminDialogOpen} onOpenChange={setIsDeleteAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Institution Admin</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete the admin account.</DialogDescription>
          </DialogHeader>
          {adminToDelete && (
            <div className="py-4">
              <div className="mb-2">
                <p className="text-sm"><span className="font-medium">Email:</span> {adminToDelete.email}</p>
                <p className="text-sm"><span className="font-medium">Institution:</span> {adminToDelete.institution?.name ?? '—'}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteAdminDialogOpen(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!adminToDelete) return
                    try {
                      await adminApi.deleteAdmin(adminToDelete.adminId)
                      toast.success('Admin deleted')
                      setAdmins((prev) => prev.filter((x) => x.adminId !== adminToDelete.adminId))
                      setIsDeleteAdminDialogOpen(false)
                      setAdminToDelete(null)
                    } catch (error) {
                      const msg = axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined
                      toast.error(msg || 'Failed to delete admin')
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
