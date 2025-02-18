import { useQuery, useQueryClient } from '@tanstack/react-query';

import SubscriptionApi from '@/lib/domains/subscription';

export function useSubscriptions() {
  const queryClient = useQueryClient();

  const {
    data: subscriptions = [],
    isLoading,
    isError,
  } = useQuery(
    {
      queryKey: ['subscriptions'],
      queryFn: SubscriptionApi.getSubscriptions,
      staleTime: 300000,
    },
    queryClient,
  );

  return {
    subscriptions,
    isLoading,
    isError,
  };
}
