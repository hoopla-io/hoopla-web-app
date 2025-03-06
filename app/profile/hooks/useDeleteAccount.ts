import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/auth-context';
import { AuthApi } from '@/lib/domains/auth';

interface Props {
  onError: (error: { message: string }) => void;
}

export function useDeleteAccount(props: Props) {
  const queryClient = useQueryClient();

  const router = useRouter();

  const { logout } = useAuth();

  const {
    mutate: deleteAccount,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: AuthApi.deleteAccount,
    onSuccess: () => {
      logout();
      queryClient.clear();
      router.push('/');
    },
    onError: error => {
      props.onError(error);
    },
  });

  return {
    deleteAccount,
    isError,
    isSuccess,
  };
}
