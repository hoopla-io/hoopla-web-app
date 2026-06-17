import { FC } from "react";

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
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  return (
    <Drawer
      open={isLoginModalOpen}
      onOpenChange={(open) => {
        if (!open) closeLoginModal();
      }}
    >
      <DrawerContent className="pb-6">
        <DrawerTitle className="sr-only">Sign In</DrawerTitle>
        <DrawerDescription className="sr-only">
          Sign in with your phone number to continue.
        </DrawerDescription>
        <div className="w-full max-w-md mx-auto">
          <LoginForm />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
