import { httpClient } from "@/api/http-client";

/** One drink line within a settled order, as returned by GET /user/orders/history. */
export interface OrderHistoryDrink {
  drinkId: number;
  drinkName: string;
  drinkPrice: number;
  status: string;
  drinkImageUrl: string;
}

/**
 * A settled order on the "Order History" list. Returned by
 * GET /user/orders/history — distinct from `ActiveOrder` (in-progress orders
 * on the home screen), so there is no top-level `orderStatus` here: an order
 * that still needs action (payment, cancellation) lives in `ActiveOrder`
 * instead. Each drink carries its own `status` since a multi-item order can
 * settle its items independently (e.g. one refunded, the rest fulfilled).
 */
export interface Order {
  id: number;
  shopName: string;
  shopIconUrl: string;
  drinks: OrderHistoryDrink[];
  purchasedAt: string;
  purchasedAtUnix: number;
  cashback_earned: number;
  hasFeedback: boolean;
}

/**
 * An in-progress order shown on the home screen "Current order" card.
 * Returned by GET /user/orders/active. Distinct from `Order` (history):
 * the status set is different and it carries `hasFeedback`. `cashback_earned`
 * keeps the backend's snake_case key.
 */
export interface ActiveOrder {
  id: number;
  shopName: string;
  shopIconUrl: string | null;
  drinkName: string;
  // Known statuses kept as literals for autocomplete; `string & {}` still
  // accepts any future status the backend adds without widening to bare string.
  orderStatus:
    | "pending_payment"
    | "pending"
    | "preparing"
    | "ready"
    | (string & {});
  productPrice: number;
  purchasedAt: string;
  purchasedAtUnix: number;
  cashback_earned: number;
  hasFeedback: boolean;
}

export interface PendingFeedbackDrink {
  orderItemId: number;
  drinkId: number;
  drinkName: string;
  drinkPrice: number;
  status: string;
  drinkImageUrl: string | null;
}

/** Returned by GET /orders/feedbacks/pending — shaped like a history entry,
 * with the order item id on each drink so items can be rated one by one. */
export interface PendingFeedbackOrder {
  id: number;
  shopName: string;
  shopIconUrl: string | null;
  drinks: PendingFeedbackDrink[];
  purchasedAt: string;
  purchasedAtUnix: number;
  cashback_earned: number;
}

/** A modifier chosen on a drink, nested under it by the backend. */
export interface OrderDetailModifier {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

/** One drink line on an order. The backend nests modifiers and feedback under
 * their drink and pre-computes `amount`, so the client no longer regroups a
 * flat item list or fetches ratings separately. */
export interface OrderDetailItem {
  id: number;
  item_type: string;
  name: string;
  /** Base price, before modifiers and quantity. Use `amount` for the line total. */
  price: number;
  quantity: number;
  imageUrl?: string | null;
  /** Always null now that modifiers are nested; kept as the backend still sends it. */
  parent_item_id: number | null;
  /** The rating left on this drink, or null if it hasn't been rated. */
  feedback: { rating: number; comment: string | null } | null;
  modifiers: OrderDetailModifier[];
  /** Line total: (price + modifiers) × quantity. */
  amount: number;
}

export interface OrderDetail {
  id: number;
  shopName: string;
  shopIconUrl: string | null;
  // Full backend status set. `paid`/`preparing`/`ready` were previously
  // missing here, which made the status pill fall through to a wrong default.
  orderStatus:
    | "completed"
    | "cancelled"
    | "pending_payment"
    | "paid"
    | "pending"
    | "preparing"
    | "ready"
    | "error"
    | (string & {});
  /** Order total, in sum. */
  amount: number;
  purchasedAt: string;
  purchasedAtUnix: number;
  items: OrderDetailItem[];
  cashback_used: number;
  cashback_earned: number;
  fiscalLink: string | null;
  /** Applied promocode, if any (in sum). */
  promoCode?: string | null;
  promoDiscount?: number;
  /** Note the user left for the barista. */
  comment?: string | null;
  /** Live Rahmat payment URL — present only while orderStatus is
   * "pending_payment" and the invoice is still open. Lets the detail page
   * offer "Complete payment" for an order that wasn't paid at checkout. */
  checkout_url?: string;
  /** Set instead of checkout_url while a host-platform (Eight) order awaits
   * payment — pass to the host bridge, don't navigate to it. */
  bridge_order_id?: string;
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
    description?: string | null;
  };
  validatedAt: string;
  validatedAtUnix: number;
  /** Legacy modifier map (still sent). Keyed by the group's modifierKey. */
  modifications: Record<string, any>;
  /**
   * First-class modifier groups with display name + min/max selection rules.
   * Additive — present only on newer backends; fall back to `modifications`.
   */
  modifierGroups?: ModifierGroup[];
  cashback_percent: number;
}

export interface ModifierOption {
  modificationId: string | number;
  modificationName: string;
  modificationPrice: number;
  /** Usually equals the group key; included for completeness. */
  modificationKey?: string;
  modificationGroupId?: string | number;
}

export interface ModifierGroup {
  /** Identifies the group; equals each option's modifierKey on checkout. */
  key: string;
  /** Friendly display name (defaults to the POS key on the backend). */
  name: string;
  /** Minimum options the customer must pick. 0 = optional. */
  minSelect: number;
  /** Maximum options the customer may pick. null = unlimited. */
  maxSelect: number | null;
  options: ModifierOption[];
}

export interface SelectedModifier {
  modifierGroupId: string;
  modifierId: string;
  modifierKey: string;
  modifierPrice: number;
  modifierName?: string;
}

/**
 * Normalizes a validate-order option (legacy or grouped) into the
 * SelectedModifier shape the create endpoint expects. `fallbackKey` is the
 * group key, used when the option doesn't carry its own key/group id.
 */
export function toSelectedModifier(
  option: any,
  fallbackKey: string
): SelectedModifier {
  return {
    modifierGroupId: String(option?.modificationGroupId ?? fallbackKey),
    modifierId: String(option?.modificationId ?? ""),
    modifierKey: String(option?.modificationKey ?? fallbackKey),
    modifierPrice: option?.modificationPrice ?? 0,
    modifierName: option?.modificationName ?? "",
  };
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
  /** Set instead of checkout_url when the order is paid through a host
   * platform's native sheet (Eight). Pass it to the host bridge, don't
   * navigate to it — it's an id, not a URL. */
  bridge_order_id?: string;
}

export interface PaymentStatus {
  order_id: number;
  status: string;
  receipt_url?: string;
}

/** Statuses past which no further payment activity is expected — polling stops.
 * "pending_payment" is deliberately absent: that's the one we wait on. */
const SETTLED_ORDER_STATUSES = [
  "paid",
  "pending",
  "preparing",
  "completed",
  "cancelled",
  "error",
];

export function isOrderSettled(status: string | undefined): boolean {
  return Boolean(status) && SETTLED_ORDER_STATUSES.includes(status as string);
}

export const OrdersApi = {
  getList: async (page: number, limit: number = 10) => {
    const response: any = await httpClient.get("/user/orders/history", {
      params: { page, limit },
    });
    const data = (response.data ?? []).map(adaptOrderHistoryItem) as Order[];

    // Fall back to a single-page shape if the endpoint doesn't echo pagination
    // meta, so infinite-scroll just stops after the first page instead of
    // looping forever.
    const meta: OrderListMeta = response.meta ?? {
      itemsPerPage: limit,
      totalItems: data.length,
      currentPage: page,
      lastPage: page,
    };

    return { data, meta };
  },

  getActive: async () => {
    const response: any = await httpClient.get("/user/orders/active");
    return (response.data ?? []).map(adaptOrderListItem) as ActiveOrder[];
  },

  getDetail: async (orderId: number) => {
    const response: any = await httpClient.get(`/user/orders/${orderId}`);

    return (response.data ?? response) as OrderDetail;
  },

  /** Cheap status-only read, for polling while a payment completes out of band
   * (a host platform's native sheet, where we get no callback of our own). */
  getPaymentStatus: async (orderId: number) => {
    const response: any = await httpClient.get(
      `/user/orders/${orderId}/payment-status`
    );

    return (response.data ?? response) as PaymentStatus;
  },

  /** Latest completed order still waiting for a rating, or null. */
  getPendingFeedback: async () => {
    const response = await httpClient.get(`/orders/feedbacks/pending`);
    return (response.data ?? null) as PendingFeedbackOrder | null;
  },

  cancelOrder: async (orderId: number) => {
    const response = await httpClient.post(`/user/orders/${orderId}/cancel`);
    return response.data;
  },

  leaveFeedback: async (orderItemId: number, rating: number, comment?: string) => {
    const response = await httpClient.post(
      `/orders/feedbacks/${orderItemId}/feedback`,
      { rating, comment: comment || null }
    );

    return response.data;
  },

  validateOrder: async (drinkId: number, shopId: number) => {
    const response: any = await httpClient.post("/user/orders/validate-order", {
      productId: drinkId,
      shopId,
    });

    const value = response.data ?? response;
    return {
      ...value,
      drink: value.product,
      modifierGroups: (value.modifierGroups ?? []).map((group: any) => ({
        ...group,
        key: String(group.id),
        name: group.name ?? String(group.id),
        options: (group.options ?? []).map((option: any) => ({
          ...option,
          modificationKey: String(group.id),
        })),
      })),
    } as ValidateOrderResponse;
  },

  checkPromocode: async (data: CheckPromocodeRequest) => {
    const response: any = await httpClient.post(
      "/user/orders/check-promocode",
      {
        code: data.code,
        shopId: data.shopId,
        productId: data.drinkId,
        modifierIds: (data.modifiers ?? []).map((modifier) =>
          Number(modifier.modifierId)
        ),
      }
    );

    return (response.data ?? response) as CheckPromocodeResult;
  },

  createOrder: async (data: CreateOrderRequest) => {
    try {
      const response: any = await httpClient.post("/user/orders/create-rahmat", {
        ...data,
        productId: data.drinkId,
        drinkId: undefined,
        quantity: 1,
        modifiers: data.modifiers.map((modifier) => ({
          modifierId: Number(modifier.modifierId),
        })),
      });
      return (response.data ?? response) as CreateOrderResponse;
    } catch (error: any) {
      // API returns 402 with payment data — treat as success. Either a Rahmat
      // checkout_url or a host-platform bridge_order_id counts; which one comes
      // back depends on how the customer's session was opened.
      const errorData = error?.data ?? error?.response?.data?.data;
      if (errorData?.checkout_url || errorData?.bridge_order_id) {
        return errorData as CreateOrderResponse;
      }
      throw error;
    }
  },
};

function adaptOrderListItem(value: any): any {
  return {
    ...value,
    drinkName: value.productName,
  };
}

function adaptOrderHistoryItem(value: any): Order {
  if (Array.isArray(value?.drinks)) {
    return value as Order;
  }

  return {
    ...value,
    drinks: [
      {
        drinkId: value?.productId ?? value?.drinkId ?? 0,
        drinkName: value?.productName ?? value?.drinkName ?? "",
        drinkPrice: value?.productPrice ?? 0,
        status: value?.orderStatus ?? "",
        drinkImageUrl:
          value?.itemImages?.[0] ?? value?.productImageUrl ?? null,
      },
    ],
  } as Order;
}

