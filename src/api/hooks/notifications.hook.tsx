import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  NotificationsApi,
  type Notification,
  type NotificationDetail,
} from "@/api/domains/notifications";

const ITEMS_PER_PAGE = 10;

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    {
      queryKey: ["notifications"],
      queryFn: async ({ pageParam = 1 }) => {
        return NotificationsApi.getList(pageParam as number, ITEMS_PER_PAGE);
      },
      getNextPageParam: (lastPage) => {
        if (lastPage.meta.currentPage < lastPage.meta.lastPage) {
          return lastPage.meta.currentPage + 1;
        }
        return undefined;
      },
      initialPageParam: 1,
      staleTime: 60000,
    },
    queryClient
  );

  const notifications: Notification[] =
    data?.pages.flatMap((page) => page.data) ?? [];

  return {
    notifications,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

export function useNotificationDetail(notificationId: number) {
  const queryClient = useQueryClient();

  const {
    data: notification,
    isLoading,
    isError,
  } = useQuery<NotificationDetail>(
    {
      queryKey: ["notification-detail", notificationId],
      queryFn: () => NotificationsApi.getDetail(notificationId),
      staleTime: 300000,
      enabled: Boolean(notificationId),
    },
    queryClient
  );

  return { notification, isLoading, isError };
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  const { mutate: markRead } = useMutation({
    mutationFn: NotificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-me"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return { markRead };
}
