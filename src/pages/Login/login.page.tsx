import { FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/context/auth.context";
import { LoginForm } from "@/components/func/LoginForm";

export const LoginPage: FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectUrl = params.get("from");
  const { isAuthenticated } = useAuth();

  const handleNavigateAfterLogin = () => {
    navigate(redirectUrl || "/");
  };

  if (isAuthenticated) {
    handleNavigateAfterLogin();
  }

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]">
      <div className="w-full max-w-md mx-4">
        <h1 className="text-center font-eugusto text-4xl text-white mb-8 tracking-wide">
          hoopla
        </h1>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <LoginForm onSuccess={handleNavigateAfterLogin} />
        </div>
      </div>
    </div>
  );
};
