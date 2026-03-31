import { httpClient } from "@/api/http-client";

export interface Notification {
  notificationId: number;
  notificationTitle: string;
  notificationDescription: string;
  files: {
    imageUrl: string;
  };
  createdAt: string;
  url: string | null;
}

export interface NotificationDetail extends Notification {
  countReads: number;
  shareUrl: string;
}

export interface NotificationListMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  lastPage: number;
}

export const NotificationsApi = {
  getList: async (page: number, itemsPerPage: number = 10) => {
    const response: any = await httpClient.get("/notifications/get-list", {
      params: { page, itemsPerPage },
    });

    // After the http-client interceptor, response.data is the inner data array
    // and response.meta is the pagination meta directly on the response object
    return {
      data: (response.data ?? []) as Notification[],
      meta: response.meta as NotificationListMeta,
    };
  },

  getDetail: async (notificationId: number) => {
    const response = await httpClient.get("/notifications/show", {
      params: { notificationId },
    });

    return response.data as NotificationDetail;
  },
};
