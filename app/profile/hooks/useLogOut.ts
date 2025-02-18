import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/auth-context';
import { AuthApi } from '@/lib/domains/auth';

interface Props {
  onError: (error: { message: string }) => void;
}

export function useLogOut(props: Props) {
  const queryClient = useQueryClient();

  const router = useRouter();

  const { logout: logOut } = useAuth();

  const {
    mutate: logout,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: AuthApi.logout,
    onSuccess: () => {
      logOut();
      queryClient.clear();
      router.push('/');
    },
    onError: error => {
      props.onError(error);
    },
  });

  return {
    logout,
    isError,
    isSuccess,
  };
}
