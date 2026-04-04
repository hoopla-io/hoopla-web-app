import { httpClient } from "@/api/http-client";

export interface Notification {
  notificationId: number;
  notificationTitle: string;
  notificationDescription: string;
  files: {
    imageUrl: string;
  };
  createdAt: string;
  isNew: boolean;
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
  getList: async (page: number, itemsPerPage: number = 10, language: string = "ru") => {
    const response: any = await httpClient.get("/notifications/list", {
      params: { page, itemsPerPage, language },
    });

    return {
      data: (response.data ?? []) as Notification[],
      meta: response.meta as NotificationListMeta,
    };
  },

  getDetail: async (notificationId: number, language: string = "ru") => {
    const response = await httpClient.get("/notifications/show", {
      params: { notificationId, language },
    });

    return response.data as NotificationDetail;
  },

  markRead: async () => {
    await httpClient.post("/notifications/mark-read");
  },
};
