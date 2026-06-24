import { httpClient } from "@/api/http-client";

export interface Order {
  id: number;
  shopName: string;
  shopIconUrl: string;
  drinkName: string;
  orderStatus: "completed" | "cancelled" | "pending_payment" | "pending" | "error";
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
  orderStatus: "completed" | "cancelled" | "pending_payment" | "pending" | "error";
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
  /** Applied promocode, if any (in sum). */
  promoCode?: string | null;
  promoDiscount?: number;
  /** Note the user left for the barista. */
  comment?: string | null;
}

export interface OrderListMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  lastPage: number;
}

export interface ValidateOrderResponse {
  partner: {
    id: number;
    name: string;
  };
  shop: {
    id: number;
    name: string;
  };
  drink: {
    id: number;
    name: string;
    amount: number;
    imageUrl: string;
  };
  validatedAt: string;
  validatedAtUnix: number;
  modifications: Record<string, any>;
  cashback_percent: number;
}

export interface SelectedModifier {
  modifierGroupId: string;
  modifierId: string;
  modifierKey: string;
  modifierPrice: number;
  modifierName?: string;
}

export interface CreateOrderRequest {
  cashback_amount: number;
  /** Optional free-text note from the user to the barista. */
  comment?: string;
  drinkId: number;
  modifiers: SelectedModifier[];
  shopId: number;
  use_cashback: boolean;
  /** Optional promocode to apply at order creation. */
  promo_code?: string;
}

export interface CheckPromocodeRequest {
  code: string;
  shopId: number;
  drinkId: number;
  modifiers?: SelectedModifier[];
}

/** All money values here are in sum (same unit the receipt already shows). */
export interface CheckPromocodeResult {
  valid: boolean;
  code: string;
  discountType: "percent" | "fixed" | string;
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  total: number;
}

export interface CreateOrderResponse {
  order_id: number;
  amount: number;
  checkout_url?: string;
  deeplink?: string;
  short_link?: string;
  expires_at?: string;
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

  validateOrder: async (drinkId: number, shopId: number) => {
    const response: any = await httpClient.post("/user/orders/validate-order", {
      drinkId,
      shopId,
    });

    return (response.data ?? response) as ValidateOrderResponse;
  },

  checkPromocode: async (data: CheckPromocodeRequest) => {
    const response: any = await httpClient.post(
      "/user/orders/check-promocode",
      data
    );

    return (response.data ?? response) as CheckPromocodeResult;
  },

  createOrder: async (data: CreateOrderRequest) => {
    try {
      const response: any = await httpClient.post("/user/orders/create-rahmat", data);
      return (response.data ?? response) as CreateOrderResponse;
    } catch (error: any) {
      // API returns 402 with payment data — treat as success
      const errorData = error?.data ?? error?.response?.data?.data;
      if (errorData?.checkout_url) {
        return errorData as CreateOrderResponse;
      }
      throw error;
    }
  },
};
