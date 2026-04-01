import { httpClient } from "@/api/http-client";

export interface Order {
  id: number;
  shopName: string;
  shopIconUrl: string;
  drinkName: string;
  orderStatus: "completed" | "cancelled" | "pending_payment";
  productPrice: number;
  purchasedAt: string;
  purchasedAtUnix: number;
  cashback_earned: number;
}

export interface OrderDetail {
  id: number;
  shopName: string;
  drinkName: string;
  drinkImageUrl: string;
  orderStatus: "completed" | "cancelled" | "pending_payment";
  productPrice: number;
  purchasedAt: string;
  purchasedAtUnix: number;
  items: {
    item_type: string;
    name: string;
    price: number;
  }[];
  cashback_used: number;
  cashback_earned: number;
  fiscalLink: string | null;
}

export interface OrderListMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  lastPage: number;
}

export const OrdersApi = {
  getList: async (page: number, limit: number = 10) => {
    const response: any = await httpClient.get("/user/orders/orders-list", {
      params: { page, limit },
    });

    return {
      data: (response.data ?? []) as Order[],
      meta: response.meta as OrderListMeta,
    };
  },

  getDetail: async (orderId: number) => {
    const response: any = await httpClient.get(`/user/orders/${orderId}`);

    return (response.data ?? response) as OrderDetail;
  },

  getFeedback: async (orderId: number) => {
    try {
      const response = await httpClient.get(`/user/orders/${orderId}/feedback`);
      return response.data as { rating: number; comment: string } | null;
    } catch {
      return null;
    }
  },

  cancelOrder: async (orderId: number) => {
    const response = await httpClient.post(`/user/orders/${orderId}/cancel`);
    return response.data;
  },

  leaveFeedback: async (orderId: number, rating: number, comment: string) => {
    const response = await httpClient.post(`/orders/feedbacks/${orderId}/feedback`, {
      rating,
      comment,
    });

    return response.data;
  },
};
