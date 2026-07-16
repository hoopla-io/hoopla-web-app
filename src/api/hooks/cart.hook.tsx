import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CartApi,
  type AddCartItemRequest,
  type CartCheckoutRequest,
} from "@/api/domains/cart";
import { useAuth } from "@/context/auth.context";

export function useCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, isError } = useQuery(
    {
      queryKey: ["cart"],
      queryFn: () => CartApi.getCart(),
      enabled: isAuthenticated,
      staleTime: 15000,
    },
    queryClient
  );

  return { cart: data ?? null, isLoading, isError };
}

export function useCartCount() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data } = useQuery(
    {
      queryKey: ["cart-count"],
      queryFn: () => CartApi.getCount(),
      enabled: isAuthenticated,
      staleTime: 15000,
    },
    queryClient
  );

  return data?.count ?? 0;
}

function invalidateCart(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["cart"] });
  queryClient.invalidateQueries({ queryKey: ["cart-count"] });
}

/**
 * A 409 here means the customer already has an active cart for a different
 * shop — the caller should catch this and prompt to clear the existing cart.
 */
export function isCrossShopCartConflict(error: any): boolean {
  return (error?.status ?? error?.response?.status) === 409;
}

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddCartItemRequest) => CartApi.addItem(data),
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      CartApi.updateItemQuantity(itemId, quantity),
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => CartApi.removeItem(itemId),
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => CartApi.clearCart(),
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function useApplyCartPromo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => CartApi.applyPromo(code),
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function useClearCartPromo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => CartApi.clearPromo(),
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function useSetCartComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: string) => CartApi.setComment(comment),
    onSuccess: () => invalidateCart(queryClient),
  });
}

export function useCheckoutCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: CartCheckoutRequest) => CartApi.checkout(data),
    onSuccess: () => {
      invalidateCart(queryClient);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["get-me"] });
      queryClient.invalidateQueries({ queryKey: ["active-orders"] });
    },
  });
}
