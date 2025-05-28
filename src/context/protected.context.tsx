import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth.context";
import { LoadingScreen } from "@/components/func/Loading";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, pending } = useAuth();
  const location = useLocation();

  if (isLoading) {
    <LoadingScreen header="Loading..." description="Please wait..." />;
  }

  if (!isAuthenticated && !pending) {
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
