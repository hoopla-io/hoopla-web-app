import { FC, useState } from "react";
import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, Minus, Plus, Tag, X } from "lucide-react";
import toast from "react-hot-toast";

import { Page } from "@/components/Page";
import { useCreateOrder, useCheckPromocode } from "@/api/hooks/orders.hook";
import { useGetMe } from "@/api/hooks/profile.hook";
import { formatBalance, cn } from "@/helpers/utils";
import type {
  ValidateOrderResponse,
  SelectedModifier,
  CheckPromocodeResult,
} from "@/api/domains/orders";

function formatPrice(price: number): string {
  return formatBalance(price) + " UZS";
}

export const OrderReceiptPage: FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const createOrder = useCreateOrder();
  const checkPromo = useCheckPromocode();
  const { userInfo } = useGetMe();

  const state = location.state as {
    validatedOrder: ValidateOrderResponse;
    selectedModifiers: SelectedModifier[];
    comment?: string;
  } | null;

  // When the drink has modifiers, the note is captured on the modifier step and
  // passed through here — in that case we don't render a second textarea.
  const commentHandledUpstream = typeof state?.comment === "string";

  const [useCashback, setUseCashback] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState(0);
  const [comment, setComment] = useState(state?.comment ?? "");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<CheckPromocodeResult | null>(
    null
  );
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!state?.validatedOrder) {
    return <Navigate to={`/shops/${shopId}`} replace />;
  }

  const { validatedOrder, selectedModifiers = [] } = state;

  const modifiersTotal = selectedModifiers.reduce(
    (sum, m) => sum + m.modifierPrice,
    0
  );
  const subtotal = validatedOrder.drink.amount + modifiersTotal;
  // Promo is applied to the subtotal first; cashback then covers the remainder.
  const promoDiscount = appliedPromo?.discountAmount ?? 0;
  const afterPromo = Math.max(0, subtotal - promoDiscount);
  const userBalance = userInfo?.balance ?? 0;
  const maxCashback = Math.min(userBalance, afterPromo);
  // Clamp here so a promo that shrinks the bill never lets cashback over-apply.
  const appliedCashback = useCashback ? Math.min(cashbackAmount, maxCashback) : 0;
  const finalTotal = Math.max(0, afterPromo - appliedCashback);

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
    const newAmount = Math.max(0, Math.min(maxCashback, cashbackAmount + delta * step));
    setCashbackAmount(newAmount);
    if (newAmount === 0) {
      setUseCashback(false);
    }
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoError(null);
    checkPromo.mutate(
      {
        code,
        shopId: validatedOrder.shop.id,
        drinkId: validatedOrder.drink.id,
        modifiers: selectedModifiers,
      },
      {
        onSuccess: (data) => {
          if (data?.valid) {
            setAppliedPromo(data);
            setPromoError(null);
          } else {
            setAppliedPromo(null);
            setPromoError("This promocode can't be applied to this order.");
          }
        },
        onError: (err: any) => {
          // The API returns a human-readable reason on 400 — show it directly.
          setAppliedPromo(null);
          setPromoError(
            err?.message ??
              err?.response?.data?.message ??
              "Couldn't apply this promocode. Please try again."
          );
        },
      }
    );
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  };

  const handleConfirm = () => {
    createOrder.mutate(
      {
        drinkId: validatedOrder.drink.id,
        shopId: validatedOrder.shop.id,
        modifiers: selectedModifiers,
        use_cashback: useCashback,
        cashback_amount: appliedCashback,
        comment: comment.trim() || undefined,
        promo_code: appliedPromo?.code,
      },
      {
        onSuccess: (data) => {
          if (data.checkout_url) {
            window.location.href = data.checkout_url;
          } else if (data.order_id) {
            toast.success("Order created successfully!");
            navigate(`/orders/${data.order_id}`, { replace: true });
          }
        },
        onError: (err: any) => {
          // Surface the backend's reason (e.g. an unmet modifier-group rule)
          // as a safety net behind the modifier page's client-side validation.
          toast.error(
            err?.message ??
              err?.response?.data?.message ??
              "Failed to create order. Please try again."
          );
        },
      }
    );
  };

  return (
    <Page>
      <div className="max-w-lg mx-auto pb-40">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Order Summary</h1>
        </div>

        {/* Receipt Card */}
        <div className="mx-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Top accent bar */}
            <div className="h-3 bg-[var(--color-primary)] w-full" />

            <div className="p-5">
              {/* Shop info */}
              <div className="text-center mb-4">
                <p className="font-semibold text-gray-900 text-lg">
                  {validatedOrder.shop.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {validatedOrder.partner.name}
                </p>
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed border-gray-300 my-4" />

              {/* Drink */}
              <div className="flex items-start gap-3 mb-3">
                {validatedOrder.drink.imageUrl && (
                  <img
                    src={validatedOrder.drink.imageUrl}
                    alt={validatedOrder.drink.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {validatedOrder.drink.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">Base price</p>
                </div>
                <p className="font-medium text-gray-900 flex-shrink-0">
                  {formatPrice(validatedOrder.drink.amount)}
                </p>
              </div>

              {/* Modifiers */}
              {selectedModifiers.length > 0 && (
                <div className="space-y-2 ml-[68px]">
                  {selectedModifiers.map((mod) => (
                    <div
                      key={mod.modifierId}
                      className="flex items-center justify-between"
                    >
                      <p className="text-sm text-gray-600">
                        {mod.modifierName || mod.modifierKey}
                      </p>
                      {mod.modifierPrice > 0 && (
                        <p className="text-sm text-gray-600">
                          +{formatPrice(mod.modifierPrice)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Dashed separator */}
              <div className="border-t border-dashed border-gray-300 my-4" />

              {/* Subtotal */}
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="font-medium text-gray-900">
                  {formatPrice(subtotal)}
                </p>
              </div>

              {/* Cashback percent info */}
              {validatedOrder.cashback_percent > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500">Cashback you'll earn</p>
                  <p className="text-sm font-medium text-[var(--color-primary)]">
                    {validatedOrder.cashback_percent}%
                  </p>
                </div>
              )}

              {/* Cashback Section */}
              {userBalance > 0 && (
                <>
                  <div className="border-t border-dashed border-gray-300 my-4" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Use cashback
                        </p>
                        <p className="text-xs text-gray-500">
                          Balance: {formatPrice(userBalance)}
                        </p>
                      </div>
                      <button
                        onClick={handleCashbackToggle}
                        className={cn(
                          "w-12 h-7 rounded-full transition-colors relative",
                          useCashback
                            ? "bg-[var(--color-primary)]"
                            : "bg-gray-300"
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
                </>
              )}

              {/* Promocode */}
              <div className="border-t border-dashed border-gray-300 my-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Promocode</p>
                {appliedPromo ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-green-50 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <Tag size={16} className="shrink-0 text-green-600" />
                      <span className="truncate font-semibold text-green-700">
                        {appliedPromo.code}
                      </span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
                    >
                      <X size={14} />
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <input
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
                        disabled={!promoInput.trim() || checkPromo.isPending}
                        className={cn(
                          "flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                          !promoInput.trim() || checkPromo.isPending
                            ? "cursor-not-allowed bg-gray-100 text-gray-400"
                            : "bg-[var(--color-primary)] text-white active:bg-[var(--color-primary-dark)]"
                        )}
                      >
                        {checkPromo.isPending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-500">{promoError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Dashed separator */}
              <div className="border-t border-dashed border-gray-300 my-4" />

              {/* Promo discount */}
              {appliedPromo && (
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Promo discount</p>
                  <p className="text-sm font-medium text-green-600">
                    -{formatPrice(appliedPromo.discountAmount)}
                  </p>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-gray-900">Total</p>
                <p className="text-xl font-bold text-[var(--color-primary)]">
                  {formatPrice(finalTotal)}
                </p>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="h-3 bg-[var(--color-primary)] w-full" />
          </div>
        </div>

        {/* Note to barista — only when the modifier step didn't already
            capture it (i.e. drinks with no modifiers). */}
        {!commentHandledUpstream && (
          <div className="mx-4 mt-4">
            <label
              htmlFor="order-comment"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Note to barista{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="order-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. less ice, oat milk, extra hot…"
              className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-3.5 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--color-primary)]"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {comment.length}/500
            </p>
          </div>
        )}
      </div>

      {/* Floating confirm bar — floats just above the bottom-nav pill and
          mirrors its rounded floating language, instead of the old full-width
          opaque bar the new glass nav overlapped. Outer is click-through in its
          margins so taps around the button still reach the content/nav. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+var(--tg-bottom-inset,0px)+5.75rem)] z-30 px-4">
        <div className="pointer-events-auto mx-auto max-w-lg">
          <button
            onClick={handleConfirm}
            disabled={createOrder.isPending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition-all active:scale-[0.99]",
              createOrder.isPending
                ? "cursor-not-allowed bg-gray-300"
                : "bg-[var(--color-primary)] shadow-[0_12px_30px_-8px_rgba(141,11,65,0.55)] active:bg-[var(--color-primary-dark)]"
            )}
          >
            {createOrder.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm Order  ·  ${formatPrice(finalTotal)}`
            )}
          </button>
        </div>
      </div>
    </Page>
  );
};
