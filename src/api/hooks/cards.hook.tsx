import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CardsApi,
  type BankCard,
  type BindCardStatus,
} from "@/api/domains/cards";
import { useAuth } from "@/context/auth.context";

export function useCards() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, isError } = useQuery<BankCard[]>(
    {
      queryKey: ["cards"],
      queryFn: () => CardsApi.getList(),
      staleTime: 60000,
      enabled: isAuthenticated,
    },
    queryClient
  );

  return { cards: data ?? [], isLoading, isError };
}

export function useBindCard() {
  return useMutation({
    mutationFn: () => CardsApi.bind(),
  });
}

/**
 * Polls a binding session while the customer fills in Rahmat's form in another
 * tab. Stops once the card is active or the session is otherwise closed.
 */
export function useBindCardStatus(sessionId: string | null) {
  const queryClient = useQueryClient();

  const { data } = useQuery<BindCardStatus>(
    {
      queryKey: ["cards", "bind", sessionId],
      queryFn: () => CardsApi.getBindStatus(sessionId!),
      enabled: !!sessionId,
      refetchInterval: (query) =>
        query.state.data && query.state.data.status !== "pending" ? false : 3000,
      refetchOnWindowFocus: true,
    },
    queryClient
  );

  return { bindStatus: data };
}

export function useRemoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => CardsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export type { BankCard };
