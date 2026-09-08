import { FC } from "react";
import { useTranslation } from "react-i18next";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LoginForm } from "@/components/func/LoginForm";
import { useAuth } from "@/context/auth.context";

/**
 * Global sign-in modal (bottom sheet). Opened via `openLoginModal()` from
 * AuthContext. On a successful login, AuthContext closes this modal and runs
 * the pending action, so the user stays on the page they came from.
 */
export const AuthModal: FC = () => {
  const { t } = useTranslation();
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  return (
    <Drawer
      open={isLoginModalOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginModal();
      }}
    >
      <DrawerContent className="max-h-[92dvh]">
        <DrawerTitle className="sr-only">{t("authModal.signIn")}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("authModal.description")}
        </DrawerDescription>
        {/* Scrollable body: caps the sheet height and keeps the verification
            code field reachable above the keyboard / device bottom inset. */}
        <div className="w-full max-w-md mx-auto flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+var(--tg-bottom-inset,0px))]">
          <LoginForm />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
