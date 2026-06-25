import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  GiftCardsApi,
  type RedeemGiftCardRequest,
  type RedeemGiftCardResult,
} from "@/api/domains/gift-cards";

export function useRedeemGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RedeemGiftCardRequest) => GiftCardsApi.redeem(data),
    onSuccess: (data: RedeemGiftCardResult) => {
      // Reflect the new balance immediately, then refetch to stay authoritative.
      queryClient.setQueryData(["get-me"], (old: any) =>
        old
          ? { ...old, balance: data.balance, currency: data.currency ?? old.currency }
          : old
      );
      queryClient.invalidateQueries({ queryKey: ["get-me"] });
    },
  });
}
