import { useQuery, useQueryClient } from '@tanstack/react-query';

import PaymentApi from '@/lib/domains/payment';

interface PaymentSystem {
  id: number;
  name: string;
  logoUrl: string;
}

export function usePaymentSystems() {
  const queryClient = useQueryClient();

  const {
    data: paymentSystems = [],
    isLoading,
    isError,
    error,
  } = useQuery<PaymentSystem[]>(
    {
      queryKey: ['payment-systems'],
      queryFn: () => PaymentApi.getPaymentSystems(),
      staleTime: 300000, // 5 minutes
    },
    queryClient,
  );

  return {
    paymentSystems,
    isLoading,
    isError,
    error,
  };
}
