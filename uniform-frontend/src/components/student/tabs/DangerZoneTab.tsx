// uniform-frontend/src/components/student/tabs/DangerZoneTab.tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteAccount } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import type { UserData } from '../types';

interface DangerZoneTabProps {
  userData: UserData;
  onLogout: () => void;
  navigate: (options: { to: string }) => void;
}

export default function DangerZoneTab({ onLogout, navigate }: DangerZoneTabProps) {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Password Required", {
        description: "Please enter your password to delete your account."
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const success = await deleteAccount(deletePassword);
      if (success) {
        toast.success("Account Deleted", {
          description: "Your account has been permanently deleted."
        });
        onLogout();
        navigate({ to: "/student/studentLogin" });
      } else {
        toast.error("Deletion Failed", {
          description: "Could not delete your account. Please check your password and try again."
        });
      }
    } catch (error: unknown) {
      console.error(error);
      let errorMessage = "Could not delete your account. Please try again.";
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }
      toast.error("Deletion Failed", {
        description: errorMessage
      });
    } finally {
      setIsDeletingAccount(false);
      setDeletePassword('');
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="text-red-600">
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription className="text-red-500">
          Permanently delete your account and all associated data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Warning: This action is irreversible</h4>
              <p className="text-sm text-red-700 mt-1">
                Deleting your account will permanently remove all your data, including applications,
                academic records, and personal information. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-2">
              Delete Account
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Confirm Account Deletion</DialogTitle>
              <DialogDescription>
                Are you absolutely sure you want to delete your account? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4 py-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <div className="text-sm text-gray-700">
                <p>All your data will be permanently removed, including:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Personal profile information</li>
                  <li>Academic records</li>
                  <li>Application history</li>
                  <li>Account settings</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-password">Enter your password to confirm</Label>
              <div className="relative">
                <Input
                  id="delete-password"
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                >
                  {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletePassword('')}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!deletePassword || isDeletingAccount}
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}