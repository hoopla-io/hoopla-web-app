import { FC } from "react";

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

interface CartConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Shown when adding an item hits a 409 — the customer already has an active
 * cart at a different shop. Clearing it and retrying is an explicit,
 * confirmed step, never automatic, so they don't lose another cart's
 * contents by accident.
 */
export const CartConflictDialog: FC<CartConflictDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-2xl max-w-sm">
      <AlertDialogHeader>
        <AlertDialogTitle>You have items from another cafe</AlertDialogTitle>
        <AlertDialogDescription>
          Your cart already has items from a different cafe. Clear it to add
          this drink instead?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="rounded-xl">Go back</AlertDialogCancel>
        <AlertDialogAction
          className="rounded-xl bg-red-500 text-white hover:bg-red-600"
          onClick={onConfirm}
          disabled={isPending}
        >
          Clear cart &amp; add
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
