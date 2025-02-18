import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { AuthApi } from '@/lib/domains/auth';

export function useGetMe() {
  const { isAuthenticated } = useAuth();

  const {
    data: userInfo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['get-me'],
    queryFn: AuthApi.getUser,
    staleTime: 300000, // 5 minutes
    enabled: isAuthenticated,
  });

  return {
    userInfo,
    isLoading,
    isError,
  };
}
