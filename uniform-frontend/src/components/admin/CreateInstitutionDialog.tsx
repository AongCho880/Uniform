// uniform-frontend/src/components/admin/CreateInstitutionDialog.tsx
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { adminApi } from '@/api/admin/adminApi';
import { Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// Predefined categories for the dropdown
const INSTITUTION_CATEGORIES = ['University', 'College', 'Science and Technology University'];

const OWNERSHIP_OPTIONS = ['PUBLIC', 'PRIVATE'] as const;
const INSTITUTION_TYPE_OPTIONS = ['GENERAL', 'ENGINEERING'] as const;

// Define a proper type for the payload
interface CreateInstitutionPayload {
  name: string;
  shortName?: string;
  categoryName?: string;
  ownership?: 'PUBLIC' | 'PRIVATE';
  type?: 'GENERAL' | 'ENGINEERING';
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  establishedYear?: number;
  logoUrl?: string;
}

interface CreateInstitutionDialogProps {
  onInstitutionCreated: () => void;
  // When true, the dialog opens by default (useful for deep-links)
  defaultOpen?: boolean;
  // When true, hides the internal trigger button so parent controls opening
  hideTrigger?: boolean;
}

export function CreateInstitutionDialog({ onInstitutionCreated, defaultOpen = false, hideTrigger = false }: CreateInstitutionDialogProps) {
  const [isOpen, setIsOpen] = useState(!!defaultOpen);
  const [newInstitution, setNewInstitution] = useState({
    name: '',
    shortName: '',
    categoryName: '',
    ownership: '',
    type: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    establishedYear: '',
    logoUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const computeCategoryNameForPayload = (categoryName?: string, ownership?: string) => {
    const trimmed = (categoryName || '').trim();
    if (!trimmed) return undefined;
    const lc = trimmed.toLowerCase();
    if (lc.includes('science') && lc.includes('technology') && ownership) {
      const own = String(ownership).toUpperCase() === 'PUBLIC' ? 'Public' : 'Private';
      return `${own} Science and Technology University`;
    }
    return trimmed;
  };

  const handleCreateInstitution = async () => {
    if (!newInstitution.name.trim()) {
      toast.error('Institution name is required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Build payload — backend currently accepts name and optional categoryName.
      // We include other optional fields for future compatibility.
      const payload: CreateInstitutionPayload = {
        name: newInstitution.name.trim(),
        shortName: newInstitution.shortName?.trim() || undefined,
        categoryName: computeCategoryNameForPayload(newInstitution.categoryName, newInstitution.ownership) || undefined,
        ownership: (newInstitution.ownership as 'PUBLIC' | 'PRIVATE') || undefined,
        type: (newInstitution.type as 'GENERAL' | 'ENGINEERING') || undefined,
        description: newInstitution.description?.trim() || undefined,
        address: newInstitution.address?.trim() || undefined,
        phone: newInstitution.phone?.trim() || undefined,
        email: newInstitution.email?.trim() || undefined,
        website: newInstitution.website?.trim() || undefined,
        establishedYear:
          newInstitution.establishedYear && !Number.isNaN(Number(newInstitution.establishedYear))
            ? Number(newInstitution.establishedYear)
            : undefined,
        logoUrl: newInstitution.logoUrl?.trim() || undefined,
      };

      await adminApi.createInstitution(payload);

      toast.success('Institution created successfully');
      setIsOpen(false);
      setNewInstitution({
        name: '',
        shortName: '',
        categoryName: '',
        ownership: '',
        type: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        establishedYear: '',
        logoUrl: '',
      });
      onInstitutionCreated();
    } catch (error) {
      toast.error('Failed to create institution');
      console.error('Error creating institution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog is closed
      setNewInstitution({
        name: '',
        shortName: '',
        categoryName: '',
        ownership: '',
        type: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        establishedYear: '',
        logoUrl: '',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Institution
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Institution</DialogTitle>
          <DialogDescription>
            Add a new educational institution to the system.
          </DialogDescription>
        </DialogHeader>
        {/* Form body */}
        <div className="grid gap-4 py-4">
        {/* Name */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name <span className="text-gray-700">*</span>
          </Label>
          <Input
            id="name"
            value={newInstitution.name}
            onChange={(e) => setNewInstitution({ ...newInstitution, name: e.target.value })}
            className="col-span-3"
            placeholder="Enter institution name"
            required
          />
        </div>

        {/* Short Name */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="shortName" className="text-right">
            Short Name
          </Label>
          <Input
            id="shortName"
            value={newInstitution.shortName}
            onChange={(e) => setNewInstitution({ ...newInstitution, shortName: e.target.value })}
            className="col-span-3"
            placeholder="e.g., DU, BUET"
            maxLength={20}
          />
        </div>

          {/* Category */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              value={newInstitution.categoryName}
              onValueChange={(value) => setNewInstitution({ ...newInstitution, categoryName: value })}
            >
              <SelectTrigger id="category" className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ownership */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ownership" className="text-right">
              Ownership
            </Label>
            <Select
              value={newInstitution.ownership}
              onValueChange={(value) => setNewInstitution({ ...newInstitution, ownership: value })}
            >
              <SelectTrigger id="ownership" className="col-span-3">
                <SelectValue placeholder="Select ownership" />
              </SelectTrigger>
              <SelectContent>
                {OWNERSHIP_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Institution Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select
              value={newInstitution.type}
              onValueChange={(value) => setNewInstitution({ ...newInstitution, type: value })}
            >
              <SelectTrigger id="type" className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right mt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={newInstitution.description}
              onChange={(e) => setNewInstitution({ ...newInstitution, description: e.target.value })}
              className="col-span-3"
              placeholder="Brief description"
              rows={3}
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Input
              id="address"
              value={newInstitution.address}
              onChange={(e) => setNewInstitution({ ...newInstitution, address: e.target.value })}
              className="col-span-3"
              placeholder="Street, City, State"
            />
          </div>

          {/* Phone */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={newInstitution.phone}
              onChange={(e) => setNewInstitution({ ...newInstitution, phone: e.target.value })}
              className="col-span-3"
              placeholder="+1 555 000 1234"
              inputMode="tel"
            />
          </div>

          {/* Email */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={newInstitution.email}
              onChange={(e) => setNewInstitution({ ...newInstitution, email: e.target.value })}
              className="col-span-3"
              placeholder="contact@institution.edu"
            />
          </div>

          {/* Website */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="website" className="text-right">
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={newInstitution.website}
              onChange={(e) => setNewInstitution({ ...newInstitution, website: e.target.value })}
              className="col-span-3"
              placeholder="https://www.example.edu"
            />
          </div>

          {/* Established Year */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="establishedYear" className="text-right">
              Established
            </Label>
            <Input
              id="establishedYear"
              type="number"
              value={newInstitution.establishedYear}
              onChange={(e) => setNewInstitution({ ...newInstitution, establishedYear: e.target.value })}
              className="col-span-3"
              placeholder="YYYY"
              min={1800}
              max={currentYear}
            />
          </div>

          {/* Logo URL */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="logoUrl" className="text-right">
              Logo URL
            </Label>
            <Input
              id="logoUrl"
              type="url"
              value={newInstitution.logoUrl}
              onChange={(e) => setNewInstitution({ ...newInstitution, logoUrl: e.target.value })}
              className="col-span-3"
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateInstitution} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
