import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Coffee,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Page } from "@/components/Page";
import { startEightPayment } from "@/helpers/eight";
import { beginBridgePayment } from "@/pages/PaymentWaiting/payment-waiting.page";
import { LoadingScreen } from "@/components/func/Loading";
import { OrdersApi } from "@/api/domains/orders";
import { useShop, useShopDrinks } from "@/api/hooks/shops.hook";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCart,
  useUpdateCartItemQuantity,
  useRemoveCartItem,
  useClearCart,
  useApplyCartPromo,
  useClearCartPromo,
  useSetCartComment,
  useCheckoutCart,
} from "@/api/hooks/cart.hook";
import { useGetMe } from "@/api/hooks/profile.hook";
import { formatBalance, cn } from "@/helpers/utils";

function formatPrice(price: number): string {
  return formatBalance(price) + " UZS";
}

// Checkout dispatches to a slow external billing/POS service. If the request
// still fails or times out client-side, the backend may already have created
// the order and consumed the cart — so a naive retry would 404 ("no active
// cart") and strand the customer on an unpaid order they can't see. Before
// surfacing the error, check whether a pending-payment order actually landed
// and, if so, resume its payment instead of retrying checkout. Read-only:
// it never re-triggers checkout, so it can't loop.
async function tryRecoverPendingCheckout(): Promise<boolean> {
  const activeOrders = await OrdersApi.getActive();
  const pendingOrder = activeOrders
    .filter((order) => order.orderStatus === "pending_payment")
    .sort((a, b) => b.purchasedAtUnix - a.purchasedAtUnix)[0];

  if (!pendingOrder) return false;

  // Only resume an order that could plausibly be the one this checkout just
  // created — an old unpaid order sitting around from an earlier session
  // shouldn't get silently resumed just because the current checkout errored.
  const recentEnough =
    pendingOrder.purchasedAtUnix >= Math.floor(Date.now() / 1000) - 120;
  if (!recentEnough) return false;

  const detail = await OrdersApi.getDetail(pendingOrder.id);
  if (typeof detail.checkout_url === "string" && detail.checkout_url.length > 0) {
    window.location.href = detail.checkout_url;
    return true;
  }

  if (typeof detail.bridge_order_id === "string" && detail.bridge_order_id.length > 0) {
    // Send them to the waiting screen either way. The order really exists and
    // their cashback is already spent on it, so reporting "checkout failed" and
    // leaving them on the cart is the one outcome that's certainly wrong; the
    // waiting screen can re-arm the sheet if the bridge wasn't ready here.
    startEightPayment(detail.bridge_order_id);
    // HashRouter: a bare path would reload the SPA at "/" and land the customer
    // on Home instead of the waiting screen.
    window.location.hash = `#/orders/${pendingOrder.id}/awaiting-payment`;
    return true;
  }

  return false;
}

export const CartPage: FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cart, isLoading } = useCart();
  const updateQuantity = useUpdateCartItemQuantity();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const applyPromo = useApplyCartPromo();
  const clearPromo = useClearCartPromo();
  const setCartComment = useSetCartComment();
  const checkout = useCheckoutCart();
  const { userInfo } = useGetMe();
  const { shopDetail } = useShop({ shopId: cart?.shopId ?? 0 });
  const { categories: shopDrinkCategories } = useShopDrinks(cart?.shopId ?? 0);

  const drinkPictureById = new Map<number, string | null>();
  for (const category of shopDrinkCategories) {
    for (const drink of category.drinks) {
      drinkPictureById.set(drink.id, drink.pictureUrl);
    }
  }

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingItemIds, setPendingItemIds] = useState<Set<number>>(new Set());
  const [useCashback, setUseCashback] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState(0);
  const [comment, setComment] = useState("");
  const [commentDirty, setCommentDirty] = useState(false);

  // Sync from the server once loaded — but never stomp text the customer is
  // actively typing (commentDirty), and only once per load, not on every
  // background refetch.
  useEffect(() => {
    if (!commentDirty && !setCartComment.isPending && cart) {
      setComment(cart.comment ?? "");
    }
  }, [cart?.comment, commentDirty, cart, setCartComment.isPending]);

  // useGetMe caches the balance for 5 minutes — stale enough that the
  // cashback preview computed here can promise more than checkout can
  // actually cover (backend always re-reads the live balance for the real
  // charge). Force a fresh balance whenever the customer opens the cart,
  // where that promise is made.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["get-me"] });
  }, [queryClient]);

  if (isLoading) {
    return <LoadingScreen header="Loading your cart" description="Please wait..." />;
  }

  const items = cart?.items ?? [];
  const isBusy = (itemId: number) =>
    pendingItemIds.has(itemId) && (updateQuantity.isPending || removeItem.isPending);

  const addPendingItemId = (itemId: number) =>
    setPendingItemIds((prev) => new Set(prev).add(itemId));
  const removePendingItemId = (itemId: number) =>
    setPendingItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

  const handleQuantityChange = async (itemId: number, nextQuantity: number) => {
    addPendingItemId(itemId);
    try {
      if (nextQuantity <= 0) {
        await removeItem.mutateAsync(itemId);
      } else {
        await updateQuantity.mutateAsync({ itemId, quantity: nextQuantity });
      }
    } catch {
      toast.error("Couldn't update your cart. Please try again.");
    } finally {
      removePendingItemId(itemId);
    }
  };

  const handleApplyPromo = () => {
    if (applyPromo.isPending) return;
    const code = promoInput.trim();
    if (!code) return;
    setPromoError(null);
    applyPromo.mutate(code, {
      onError: (err: any) => {
        setPromoError(
          err?.message ??
            err?.response?.data?.message ??
            "This promocode can't be applied to this cart."
        );
      },
    });
  };

  const handleRemovePromo = () => {
    clearPromo.mutate(undefined, {
      onError: () => toast.error("Couldn't remove the promocode. Please try again."),
    });
    setPromoInput("");
    setPromoError(null);
    setPromoExpanded(false);
  };

  // Cashback is a local, unsaved choice made fresh at checkout — same as the
  // legacy single-item order flow — not persisted on the cart itself.
  const userBalance = userInfo?.balance ?? 0;
  const afterPromo = Math.max(0, (cart?.subtotal ?? 0) - (cart?.promoDiscount ?? 0));
  const maxCashback = Math.min(userBalance, afterPromo);
  const appliedCashback = useCashback ? Math.min(cashbackAmount, maxCashback) : 0;
  const hasDiscount = (cart?.promoDiscount ?? 0) > 0 || appliedCashback > 0;

  const handleCashbackToggle = () => {
    if (useCashback) {
      setUseCashback(false);
      setCashbackAmount(0);
    } else {
      setUseCashback(true);
      setCashbackAmount(maxCashback);
    }
  };

  const adjustCashback = (delta: number) => {
    const step = 1000;
    // Clamp the starting point first — if the cart shrank while cashback was
    // on, the raw cashbackAmount can exceed maxCashback, so stepping from the
    // stale value would just re-clamp and look like a dead tap.
    const current = Math.min(cashbackAmount, maxCashback);
    const newAmount = Math.max(0, Math.min(maxCashback, current + delta * step));
    setCashbackAmount(newAmount);
    if (newAmount === 0) {
      setUseCashback(false);
    }
  };

  const handleCommentBlur = () => {
    setCommentDirty(false);
    if (comment.trim() !== (cart?.comment ?? "")) {
      setCartComment.mutate(comment, {
        onError: () => toast.error("Couldn't save your note. Please try again."),
      });
    }
  };

  const handleClearCart = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => {
        setConfirmClear(false);
        toast.success("Cart cleared");
      },
      onError: () => toast.error("Couldn't clear your cart. Please try again."),
    });
  };

  // Checkout must never race an in-flight note edit: if the textarea still
  // holds an unsaved comment, save it first and wait for it to land before
  // firing the checkout POST, so the order can't ship with a stale note.
  const handleCheckout = async () => {
    if (comment.trim() !== (cart?.comment ?? "")) {
      try {
        await setCartComment.mutateAsync(comment);
      } catch {
        toast.error("Couldn't save your note. Please try again.");
        return;
      }
    }

    checkout.mutate(
      { useCashback, cashbackAmount: appliedCashback },
      {
        onSuccess: (data) => {
          // A host-platform order is paid in the host's native sheet, not by
          // navigating anywhere — hand it to the bridge and wait for the result.
          if (data.bridge_order_id && data.order_id) {
            if (!beginBridgePayment(data.bridge_order_id, data.order_id, navigate)) {
              toast.error(
                "Couldn't open the payment window. Please reopen Hoopla from the app and try again."
              );
              // The order exists and its cashback is already spent, so route to
              // the waiting screen regardless — it can re-arm the sheet.
              navigate(`/orders/${data.order_id}/awaiting-payment`, { replace: true });
            }
            return;
          }

          if (data.checkout_url) {
            window.location.href = data.checkout_url;
          } else if (data.order_id) {
            toast.success("Order placed successfully!");
            navigate(`/orders/${data.order_id}`, { replace: true });
          }
        },
        onError: async (err: any) => {
          // The billing/POS call may have failed only on the client side
          // (timeout, dropped connection) after the backend already created
          // the order. Recovery only makes sense in that case: if the server
          // did respond (e.g. a 400/409), the request definitely didn't
          // silently succeed server-side, so jumping to whatever pending
          // order happens to exist would risk redirecting to an old, unpaid
          // order the customer isn't trying to pay for right now. The axios
          // interceptor rejects the raw error (no `.status`) for
          // timeouts/network failures, and an extracted object with
          // `.status` for any real server response — so gate on that.
          const noServerResponse = !err?.status && !err?.response?.status;

          if (noServerResponse) {
            try {
              const recovered = await tryRecoverPendingCheckout();
              if (recovered) return;
            } catch {
              // Fall through to the normal error toast below.
            }
          }

          toast.error(
            err?.message ??
              err?.response?.data?.message ??
              "Failed to check out. Please try again."
          );
        },
      }
    );
  };

  // Disables checkout while any cart-mutating request is in flight, so the
  // order can't be built from a cart the server hasn't finished updating yet.
  const cartMutating =
    updateQuantity.isPending ||
    removeItem.isPending ||
    clearCart.isPending ||
    applyPromo.isPending ||
    clearPromo.isPending ||
    setCartComment.isPending ||
    pendingItemIds.size > 0;

  return (
    <Page>
      <div className="max-w-lg mx-auto pb-64">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Your Cart</h1>
              {shopDetail?.name && (
                <p className="text-xs text-gray-500">{shopDetail.name}</p>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingBag size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Browse a cafe and add some drinks to get started
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white active:bg-[var(--color-primary-dark)] transition-colors"
            >
              Browse cafes
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="mx-4 space-y-3">
              {items.map((item) => {
                const pictureUrl = drinkPictureById.get(item.drinkId);
                return (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-start gap-3">
                      {pictureUrl ? (
                        <img
                          src={pictureUrl}
                          alt={item.name}
                          className="w-14 h-14 flex-shrink-0 rounded-xl object-cover bg-gray-50"
                        />
                      ) : (
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Coffee size={22} className="text-gray-300" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="font-semibold text-gray-900">{item.name}</p>

                        {item.modifiers.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {item.modifiers.map((modifier, index) => (
                              <div
                                key={`${item.id}-${index}`}
                                className="flex items-center justify-between gap-3 text-xs text-gray-400"
                              >
                                <span className="truncate">{modifier.name}</span>
                                {modifier.price > 0 && (
                                  <span className="flex-shrink-0">
                                    +{formatBalance(modifier.price)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-3">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.lineTotal)}
                      </p>

                      <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isBusy(item.id)}
                          className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center active:bg-gray-100 disabled:opacity-50"
                          aria-label={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                        >
                          {item.quantity === 1 ? (
                            <Trash2 size={15} className="text-red-500" />
                          ) : (
                            <Minus size={15} className="text-gray-600" />
                          )}
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-gray-900">
                          {isBusy(item.id) ? (
                            <Loader2 size={14} className="animate-spin mx-auto" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isBusy(item.id)}
                          className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center active:bg-gray-100 disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promocode */}
            <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
              {cart?.promoCode ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Ticket size={20} className="shrink-0 text-green-600" />
                    <span className="truncate font-semibold text-green-700">
                      {cart.promoCode}
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    disabled={clearPromo.isPending}
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setPromoExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket size={20} className="shrink-0 text-gray-400" />
                      <span className="font-medium text-gray-900">Promo code</span>
                    </div>
                    {promoExpanded ? (
                      <ChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                  </button>

                  {promoExpanded && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            if (promoError) setPromoError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleApplyPromo();
                          }}
                          placeholder="Enter code"
                          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm uppercase outline-none transition-colors placeholder:normal-case placeholder:text-gray-400 focus:border-[var(--color-primary)]"
                        />
                        <button
                          onClick={handleApplyPromo}
                          disabled={!promoInput.trim() || applyPromo.isPending}
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                            !promoInput.trim() || applyPromo.isPending
                              ? "cursor-not-allowed bg-gray-100 text-gray-400"
                              : "bg-[var(--color-primary)] text-white active:bg-[var(--color-primary-dark)]"
                          )}
                        >
                          {applyPromo.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </button>
                      </div>
                      {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cashback */}
            {(userInfo?.balance ?? 0) > 0 && (
              <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet size={20} className="shrink-0 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Cashback:</p>
                      <p className="text-xs text-gray-500">
                        Available: {formatBalance(userInfo?.balance ?? 0)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCashbackToggle}
                    className={cn(
                      "w-12 h-7 rounded-full transition-colors relative",
                      useCashback ? "bg-[var(--color-primary)]" : "bg-gray-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform",
                        useCashback ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {useCashback && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <button
                      onClick={() => adjustCashback(-1)}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center active:bg-gray-100"
                    >
                      <Minus size={16} className="text-gray-600" />
                    </button>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        -{formatPrice(appliedCashback)}
                      </p>
                    </div>
                    <button
                      onClick={() => adjustCashback(1)}
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center active:bg-gray-100"
                    >
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Note to barista — one note for the whole cart. */}
            <div className="mx-4 mt-3">
              <label htmlFor="cart-comment" className="sr-only">
                Note to barista (optional)
              </label>
              <textarea
                id="cart-comment"
                value={comment}
                onChange={(e) => {
                  setCommentDirty(true);
                  setComment(e.target.value);
                }}
                onBlur={handleCommentBlur}
                rows={3}
                maxLength={500}
                placeholder="Add additional comment…"
                className="w-full resize-none rounded-2xl border-none bg-white p-3.5 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </>
        )}
      </div>

      {/* Sticky summary + checkout */}
      {items.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+var(--tg-bottom-inset,0px)+5.75rem)] z-30">
          <div className="pointer-events-auto mx-auto max-w-lg rounded-t-3xl bg-white px-4 pt-4 pb-4 shadow-[0_-12px_30px_-15px_rgba(0,0,0,0.25)]">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-sm",
                    hasDiscount ? "text-gray-400 line-through" : "text-gray-500"
                  )}
                >
                  Drinks:
                </p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    hasDiscount ? "text-gray-400 line-through" : "text-gray-900"
                  )}
                >
                  {formatPrice(cart?.subtotal ?? 0)}
                </p>
              </div>
              {(cart?.promoDiscount ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Promo:</p>
                  <p className="text-sm font-medium text-green-600">
                    -{formatPrice(cart!.promoDiscount)}
                  </p>
                </div>
              )}
              {appliedCashback > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Cashback:</p>
                  <p className="text-sm font-medium text-green-600">
                    -{formatPrice(appliedCashback)}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <p className="text-base font-bold text-gray-900">Total:</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatPrice(Math.max(0, afterPromo - appliedCashback))}
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkout.isPending || cartMutating}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition-all active:scale-[0.99]",
                checkout.isPending || cartMutating
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-[var(--color-primary)] shadow-[0_12px_30px_-8px_rgba(141,11,65,0.55)] active:bg-[var(--color-primary-dark)]"
              )}
            >
              {checkout.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Checkout"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Clear-cart confirmation */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes everything in your cart. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Go back</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
              onClick={handleClearCart}
              disabled={clearCart.isPending}
            >
              Clear cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};
