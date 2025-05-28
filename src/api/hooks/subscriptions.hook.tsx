import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SubscriptionApi from "@/api/domains/subscription";

type ErrorType = {
  message: string;
  code: number;
};
interface Props {
  onError: (error: ErrorType) => void;
}

export function useSubscriptions() {
  const queryClient = useQueryClient();

  const {
    data: subscriptions = [],
    isLoading,
    isError,
  } = useQuery(
    {
      queryKey: ["subscriptions"],
      queryFn: SubscriptionApi.getSubscriptions,
      staleTime: 300000,
    },
    queryClient
  );

  return {
    subscriptions,
    isLoading,
    isError,
  };
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
      queryClient.refetchQueries({ queryKey: ["subscriptions"] });
      queryClient.refetchQueries({ queryKey: ["get-me"] });
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

export function useGetDrinksStat() {
  const queryClient = useQueryClient();

  const {
    data: drinksStat,
    isLoading,
    isError,
  } = useQuery(
    {
      queryKey: ["drinks-stat"],
      queryFn: SubscriptionApi.getDrinksStat,
      staleTime: 300000,
    },
    queryClient
  );

  return {
    drinksStat,
    isLoading,
    isError,
  };
}
