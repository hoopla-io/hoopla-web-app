import { useMutation, useQueryClient } from '@tanstack/react-query';

import SubscriptionApi from '@/lib/domains/subscription';

type ErrorType = {
  message: string;
  code: number;
};
interface Props {
  onError: (error: ErrorType) => void;
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
      queryClient.refetchQueries({ queryKey: ['get-me'] });
    },
    onError: (error: ErrorType) => {
      props.onError(error);
    },
  });

  return {
    buySubscription,
    isError,
    isSuccess,
  };
}
