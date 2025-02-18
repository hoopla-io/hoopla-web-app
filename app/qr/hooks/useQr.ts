import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { AuthApi } from '@/lib/domains/auth';

interface QrCode {
  qrCode: string;
  expireAt: number;
}

export function useQr() {
  const queryClient = useQueryClient();

  const { isAuthenticated } = useAuth();

  const {
    data: qrCode,
    isLoading,
    isError,
  } = useQuery<QrCode>(
    {
      queryKey: ['qr'],
      queryFn: AuthApi.getQrCode,
      staleTime: 300000, // 5 minutes
      enabled: isAuthenticated,
    },
    queryClient,
  );

  // const {
  //   data: orders = [],
  //   isLoading: isLoadingOrders,
  //   isError: isErrorOrders,
  // } = useQuery(
  //   {
  //     queryKey: ["orders"],
  //     queryFn: AuthApi.getOrdersHistory,
  //     staleTime: 300000, // 5 minutes
  //     enabled: isAuthenticated,
  //   },
  //   queryClient
  // );

  return {
    qrCode,
    isLoading,
    isError,
    // orders,
    // isLoadingOrders,
    // isErrorOrders,
  };
}
