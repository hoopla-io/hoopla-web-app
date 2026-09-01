import { httpClient } from "@/api/http-client";
import type { SelectedModifier, CreateOrderResponse } from "@/api/domains/orders";

export interface CartItemModifier {
  name: string;
  price: number;
}

export interface CartItem {
  id: number;
  drinkId: number;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers: CartItemModifier[];
}

export interface Cart {
  id: number;
  shopId: number;
  partnerId: number;
  status: string;
  promoCode: string | null;
  comment: string | null;
  items: CartItem[];
  subtotal: number;
  promoDiscount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartCount {
  count: number;
}

export interface AddCartItemRequest {
  shopId: number;
  drinkId: number;
  quantity: number;
  modifiers?: SelectedModifier[];
}

/**
 * The cashback choice is made fresh at checkout, exactly like the legacy
 * single-item order flow (OrdersApi.createOrder) — never persisted on the
 * cart itself.
 */
export interface CartCheckoutRequest {
  useCashback?: boolean;
  cashbackAmount?: number;
}

/** Same response shape as create-order — cart-checkout reuses it. */
export type CartCheckoutResponse = CreateOrderResponse;

export const CartApi = {
  getCart: async () => {
    const response: any = await httpClient.get("/user/cart");
    return adaptCart(response.data ?? null);
  },

  getCount: async () => {
    const response: any = await httpClient.get("/user/cart/count");
    return (response.data ?? { count: 0 }) as CartCount;
  },

  addItem: async (data: AddCartItemRequest) => {
    const response: any = await httpClient.post("/user/cart/items", {
      shopId: data.shopId,
      productId: data.drinkId,
      quantity: data.quantity,
      modifiers: (data.modifiers ?? []).map((modifier) => ({
        modifierId: Number(modifier.modifierId),
      })),
    });
    return adaptCart(response.data ?? null);
  },

  updateItemQuantity: async (itemId: number, quantity: number) => {
    const response: any = await httpClient.patch(`/user/cart/items/${itemId}`, {
      quantity,
    });
    return adaptCart(response.data ?? null);
  },

  removeItem: async (itemId: number) => {
    const response: any = await httpClient.delete(`/user/cart/items/${itemId}`);
    return adaptCart(response.data ?? null);
  },

  clearCart: async () => {
    await httpClient.delete("/user/cart");
  },

  applyPromo: async (code: string) => {
    const response: any = await httpClient.post("/user/cart/promo", { code });
    return adaptCart(response.data ?? null);
  },

  clearPromo: async () => {
    const response: any = await httpClient.delete("/user/cart/promo");
    return adaptCart(response.data ?? null);
  },

  setComment: async (comment: string) => {
    const response: any = await httpClient.post("/user/cart/comment", {
      comment: comment.trim() || null,
    });
    return adaptCart(response.data ?? null);
  },

  checkout: async (data: CartCheckoutRequest = {}) => {
    try {
      // Checkout dispatches to an external billing/POS service the backend
      // allows up to 30s. The global 10s axios timeout would abort mid-dispatch
      // — the server then finishes and consumes the cart, so a retry 404s. Give
      // this one call room to outlast the backend's own timeout.
      const response: any = await httpClient.post(
        "/user/orders/cart-checkout",
        {
          use_cashback: data.useCashback ?? false,
          cashback_amount: data.cashbackAmount ?? 0,
        },
        { timeout: 35000 }
      );
      return (response.data ?? response) as CartCheckoutResponse;
    } catch (error: any) {
      // Same as OrdersApi.createOrder: a 402 with payment data is a success,
      // not a failure — the customer still needs to complete payment.
      const errorData = error?.data ?? error?.response?.data?.data;
      if (errorData?.checkout_url || errorData?.bridge_order_id) {
        return errorData as CartCheckoutResponse;
      }
      throw error;
    }
  },
};

function adaptCart(value: any): Cart | null {
  if (!value) return null;

  return {
    ...value,
    items: (value.items ?? []).map((item: any) => ({
      ...item,
      drinkId: item.productId,
    })),
  } as Cart;
}
