import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

interface SignUpToSaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The PROPERTY to claim on signup — ownership (users.id) lives on
  // properties, not projects, since the Property/Project restructure
  // (see CLAUDE.md). Registering with this id in the URL is what lets
  // /api/register hand a guest-created property to the new account.
  propertyId: number;
  // Where to send the user back to after signup — the current editor
  // path (/editor/:projectId), so Editor.tsx remounts for the SAME
  // project and its pending-fence-line-save effect actually runs.
  // Claiming the property alone isn't enough to know which project to
  // resume into once a property can hold more than one.
  returnTo: string;
}

export function SignUpToSaveModal({ open, onOpenChange, propertyId, returnTo }: SignUpToSaveModalProps) {
  const [, setLocation] = useLocation();

  const handleSignUp = () => {
    setLocation(`/register?propertyId=${propertyId}&returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Your Property</AlertDialogTitle>
          <AlertDialogDescription>
            Create an account to save your property and access it from anywhere.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not Now</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignUp}>Sign Up</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
