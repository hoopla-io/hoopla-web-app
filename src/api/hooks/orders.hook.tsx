import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  OrdersApi,
  type Order,
  type OrderDetail,
  type CreateOrderRequest,
  type CheckPromocodeRequest,
} from "@/api/domains/orders";
import { useAuth } from "@/context/auth.context";

const ITEMS_PER_PAGE = 10;

export function useOrders() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    {
      queryKey: ["orders"],
      queryFn: async ({ pageParam = 1 }) => {
        return OrdersApi.getList(pageParam as number, ITEMS_PER_PAGE);
      },
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.currentPage < lastPage.meta.lastPage) {
          return lastPage.meta.currentPage + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
      staleTime: 60000,
      enabled: isAuthenticated,
    },
    queryClient
  );

  const orders: Order[] = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    orders,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

export function useOrderDetail(orderId: number) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery<OrderDetail>(
    {
      queryKey: ["order-detail", orderId],
      queryFn: () => OrdersApi.getDetail(orderId),
      staleTime: 300000,
      enabled: Boolean(orderId) && isAuthenticated,
    },
    queryClient
  );

  return { order, isLoading, isError };
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => OrdersApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-detail"] });
    },
  });
}

export function useValidateOrder() {
  return useMutation({
    mutationFn: ({ drinkId, shopId }: { drinkId: number; shopId: number }) =>
      OrdersApi.validateOrder(drinkId, shopId),
  });
}

export function useCheckPromocode() {
  return useMutation({
    mutationFn: (data: CheckPromocodeRequest) => OrdersApi.checkPromocode(data),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => OrdersApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["get-me"] });
    },
  });
}
