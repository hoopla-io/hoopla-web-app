import { useMutation, useQueryClient } from '@tanstack/react-query';

import SubscriptionApi from '@/lib/domains/subscription';

interface Props {
  onError: (error: { message: string }) => void;
}

export function useSubscriptionBuy(props: Props) {
  const queryClient = useQueryClient();

  const {
    mutate: buySubscription,
    isError,
    isSuccess,
  } = useMutation({
    mutationFn: SubscriptionApi.buySubscription,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['subscriptions'] });
    },
    onError: error => {
      props.onError(error);
    },
  });

  return {
    buySubscription,
    isError,
    isSuccess,
  };
}
