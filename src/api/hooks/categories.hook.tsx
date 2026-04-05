import { useQuery, useQueryClient } from "@tanstack/react-query";

import { CategoriesApi, type Category } from "@/api/domains/categories";

export function useCategories() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Category[]>(
    {
      queryKey: ["categories"],
      queryFn: () => CategoriesApi.getList(),
      staleTime: 300000,
    },
    queryClient
  );

  const categories = data ?? [];

  return {
    categories,
    isLoading,
    isError,
  };
}

export type { Category };
