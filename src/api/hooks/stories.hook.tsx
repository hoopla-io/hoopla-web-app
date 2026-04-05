import { useQuery, useQueryClient } from "@tanstack/react-query";

import { StoriesApi, type StoryGroup, type StoryDetail } from "@/api/domains/stories";

export function useStoryList() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<StoryGroup[]>(
    {
      queryKey: ["stories", "list"],
      queryFn: () => StoriesApi.getList(),
      staleTime: 300000,
    },
    queryClient
  );

  return {
    stories: data ?? [],
    isLoading,
    isError,
  };
}

export function useStoryDetail(id: number | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<StoryDetail>(
    {
      queryKey: ["stories", "detail", id],
      queryFn: async () => {
        const result = await StoriesApi.getById(id!);
        queryClient.invalidateQueries({ queryKey: ["stories", "list"] });
        return result;
      },
      enabled: id !== null,
      staleTime: 0,
    },
    queryClient
  );

  return {
    story: data ?? null,
    isLoading,
    isError,
  };
}

export type { StoryGroup, StoryDetail, StoryItem } from "@/api/domains/stories";
