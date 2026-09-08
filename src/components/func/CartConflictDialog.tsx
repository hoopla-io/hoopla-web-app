import { FC } from "react";
import { useTranslation } from "react-i18next";

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
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("cartConflictDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("cartConflictDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">
            {t("cartConflictDialog.goBack")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-red-500 text-white hover:bg-red-600"
            onClick={onConfirm}
            disabled={isPending}
          >
            {t("cartConflictDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
