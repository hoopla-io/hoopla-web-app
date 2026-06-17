import { useEffect, useRef } from "react";
import { LogIn } from "lucide-react";

import { useAuth } from "@/context/auth.context";
import { LoadingScreen } from "@/components/func/Loading";
import { Button } from "@/components/ui/button";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, pending, openLoginModal } = useAuth();
  const autoOpened = useRef(false);

  // Gate behind the sign-in drawer instead of redirecting to a separate page.
  // Auto-open once on entry; if the user dismisses it, they can re-open via the
  // button below. Once authenticated, the protected page renders in place.
  useEffect(() => {
    if (!isLoading && !pending && !isAuthenticated && !autoOpened.current) {
      autoOpened.current = true;
      openLoginModal();
    }
  }, [isLoading, pending, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || pending) {
    return <LoadingScreen header="Loading..." description="Please wait..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Sign in required
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-5">
          Please sign in to view this page.
        </p>
        <Button
          onClick={() => openLoginModal()}
          className="h-12 px-6 text-base font-medium text-white rounded-xl"
        >
          <LogIn size={18} />
          Sign In
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
