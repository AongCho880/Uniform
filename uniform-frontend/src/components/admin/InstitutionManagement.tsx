// uniform-frontend/src/components/admin/InstitutionManagement.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { adminApi } from '@/api/admin/adminApi';
import { Building2, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { CreateInstitutionDialog } from './CreateInstitutionDialog';
import { useNavigate } from '@tanstack/react-router';
import { InstitutionListTable, type InstitutionWithCategory } from './InstitutionListTable';

interface InstitutionManagementProps {
  page?: number;
  search?: string;
  sortFieldProp?: 'name' | 'createdAt';
  sortDirectionProp?: 'asc' | 'desc';
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (field: 'name' | 'createdAt', direction: 'asc' | 'desc') => void;
  openCreate?: boolean;
}

export function InstitutionManagement(props: InstitutionManagementProps = {}) {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState<InstitutionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  // Local input value for search (keeps typing responsive)
  const [inputValue, setInputValue] = useState(props.search ?? '');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<'name' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState<InstitutionWithCategory | null>(null);

  // Keep local input in sync if parent controls search via URL
  useEffect(() => {
    if (props.search !== undefined && props.search !== inputValue) {
      setInputValue(props.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.search]);

  // Fetch all institutions once; front-end will handle search/sort/pagination
  const fetchInstitutions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getInstitutions();
      setInstitutions(response.institutions || []);
    } catch (error) {
      toast.error('Failed to load institutions');
      console.error('Error fetching institutions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  // Debounce external search updates when controlled via props
  useEffect(() => {
    if (props.onSearchChange) {
      const id = setTimeout(() => {
        props.onSearchChange?.(inputValue);
        props.onPageChange?.(1);
      }, 250);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleDeleteInstitution = async () => {
    if (!institutionToDelete) return;

    try {
      await adminApi.deleteInstitution(institutionToDelete.institutionId);
      toast.success('Institution deleted successfully');
      setIsDeleteDialogOpen(false);
      setInstitutionToDelete(null);
      fetchInstitutions();
    } catch (error) {
      toast.error('Failed to delete institution');
      console.error('Error deleting institution:', error);
    }
  };

  const openDeleteDialog = (institution: InstitutionWithCategory) => {
    setInstitutionToDelete(institution);
    setIsDeleteDialogOpen(true);
  };

  const handleEditInstitution = (institution: InstitutionWithCategory) => {
    // Placeholder for edit functionality
    toast.info(`Edit functionality for ${institution.name} not implemented yet`);
  };

  const handleSort = (field: 'name' | 'createdAt') => {
    let nextDirection: 'asc' | 'desc' = 'asc';
    if ((props.sortFieldProp ?? sortField) === field) {
      const currentDir = props.sortDirectionProp ?? sortDirection;
      nextDirection = currentDir === 'asc' ? 'desc' : 'asc';
    }
    if (props.onSortChange) {
      props.onSortChange(field, nextDirection);
    } else {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
      setCurrentPage(1);
    }
  };

  // Derived client-side filtering, sorting, pagination
  const query = (props.onSearchChange ? inputValue : inputValue).trim().toLowerCase();

  const filteredInstitutions = useMemo(() => {
    if (!query) return institutions;
    return institutions.filter((inst) => {
      const cat = inst.InstitutionCategory?.name?.toLowerCase() || '';
      return (
        inst.name.toLowerCase().includes(query) ||
        (inst.description?.toLowerCase().includes(query) ?? false) ||
        (inst.email?.toLowerCase().includes(query) ?? false) ||
        (inst.address?.toLowerCase().includes(query) ?? false) ||
        cat.includes(query)
      );
    });
  }, [institutions, query]);

  const sortedInstitutions = useMemo(() => {
    const field = props.sortFieldProp ?? sortField;
    const dir = props.sortDirectionProp ?? sortDirection;
    const arr = [...filteredInstitutions];
    arr.sort((a, b) => {
      if (field === 'name') {
        const an = a.name.toLowerCase();
        const bn = b.name.toLowerCase();
        return dir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
      } else {
        const at = new Date(a.createdAt).getTime();
        const bt = new Date(b.createdAt).getTime();
        return dir === 'asc' ? at - bt : bt - at;
      }
    });
    return arr;
  }, [filteredInstitutions, sortField, sortDirection, props.sortFieldProp, props.sortDirectionProp]);

  const effectivePage = props.page ?? currentPage;
  const totalItems = sortedInstitutions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (effectivePage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageInstitutions = useMemo(
    () => sortedInstitutions.slice(startIdx, endIdx),
    [sortedInstitutions, startIdx, endIdx]
  );

  // Function to get category badge color based on category name
  const getCategoryBadgeColor = (categoryName: string) => {
    const lc = categoryName.toLowerCase();
    if (lc.includes('science') && lc.includes('technology')) {
      return 'bg-indigo-100 text-indigo-800';
    }
    switch (lc) {
      case 'public':
      case 'public institution':
        return 'bg-blue-100 text-blue-800';
      case 'private':
      case 'private institution':
        return 'bg-purple-100 text-purple-800';
      case 'engineering':
        return 'bg-green-100 text-green-800';
      case 'medical':
        return 'bg-red-100 text-red-800';
      case 'science & technology':
        return 'bg-indigo-100 text-indigo-800';
      case 'agriculture':
        return 'bg-yellow-100 text-yellow-800';
      case 'arts & humanities':
        return 'bg-pink-100 text-pink-800';
      case 'business':
        return 'bg-orange-100 text-orange-800';
      case 'law':
        return 'bg-gray-100 text-gray-800';
      case 'education':
        return 'bg-teal-100 text-teal-800';
      case 'vocational':
        return 'bg-amber-100 text-amber-800';
      case 'community college':
        return 'bg-lime-100 text-lime-800';
      case 'research institute':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Institution Management</h1>
          <p className="text-gray-500">Manage educational institutions</p>
        </div>
        <CreateInstitutionDialog
          onInstitutionCreated={fetchInstitutions}
          defaultOpen={props.openCreate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institutions List</CardTitle>
          <CardDescription>View and manage all institutions in the system</CardDescription>
          <div className="flex items-center flex-wrap gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search institutions..."
                className="pl-8 pr-8"
                value={inputValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputValue(val);
                  if (!props.onSearchChange) {
                    setCurrentPage(1);
                  }
                }}
              />
              {inputValue && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setInputValue('');
                    if (props.onSearchChange) {
                      props.onSearchChange('');
                      props.onPageChange?.(1);
                    } else {
                      setCurrentPage(1);
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[84px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <InstitutionListTable
            institutions={pageInstitutions}
            loading={loading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onDelete={openDeleteDialog}
            onEdit={handleEditInstitution}
            query={query}
            onRowClick={(id) =>
              navigate({
                to: '/admin/institutions/$institutionId',
                params: { institutionId: id },
              })
            }
          />

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-gray-500">
              {totalItems === 0 ? 'No results' : (
                <>Showing {Math.min(totalItems, startIdx + 1)}–{Math.min(totalItems, endIdx)} of {totalItems} institutions</>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prev = Math.max(1, (props.page ?? currentPage) - 1);
                  if (props.onPageChange) props.onPageChange(prev); else setCurrentPage(prev);
                }}
                disabled={(props.page ?? currentPage) <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = Math.min(totalPages, (props.page ?? currentPage) + 1);
                  if (props.onPageChange) props.onPageChange(next); else setCurrentPage(next);
                }}
                disabled={(props.page ?? currentPage) >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this institution? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {institutionToDelete && (
            <div className="py-4">
              <div className="flex items-center space-x-3 mb-4">
                <Building2 className="h-8 w-8 text-gray-500" />
                <div>
                  <h3 className="font-medium">{institutionToDelete.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {format(new Date(institutionToDelete.createdAt), 'MMM dd, yyyy')}
                  </p>
                  {institutionToDelete.InstitutionCategory && (
                    <div className="mt-1">
                      <Badge className={getCategoryBadgeColor(institutionToDelete.InstitutionCategory.name)}>
                        {institutionToDelete.InstitutionCategory.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Deleting this institution will also remove all associated data including units, admins, and applications.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInstitution}>
              Delete Institution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
