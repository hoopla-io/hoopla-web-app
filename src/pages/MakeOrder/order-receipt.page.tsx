import { FC, useState } from "react";
import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { Page } from "@/components/Page";
import { useCreateOrder } from "@/api/hooks/orders.hook";
import { useGetMe } from "@/api/hooks/profile.hook";
import { formatBalance, cn } from "@/helpers/utils";
import type {
  ValidateOrderResponse,
  SelectedModifier,
} from "@/api/domains/orders";

function formatPrice(price: number): string {
  return formatBalance(price) + " UZS";
}

export const OrderReceiptPage: FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const createOrder = useCreateOrder();
  const { userInfo } = useGetMe();

  const state = location.state as {
    validatedOrder: ValidateOrderResponse;
    selectedModifiers: SelectedModifier[];
  } | null;

  const [useCashback, setUseCashback] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState(0);

  if (!state?.validatedOrder) {
    return <Navigate to={`/shops/${shopId}`} replace />;
  }

  const { validatedOrder, selectedModifiers } = state;

  const modifiersTotal = selectedModifiers.reduce(
    (sum, m) => sum + m.modifierPrice,
    0
  );
  const subtotal = validatedOrder.drink.amount + modifiersTotal;
  const userBalance = userInfo?.balance ?? 0;
  const maxCashback = Math.min(userBalance, subtotal);
  const finalTotal = useCashback ? subtotal - cashbackAmount : subtotal;

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

  const handleConfirm = () => {
    createOrder.mutate(
      {
        drinkId: validatedOrder.drink.id,
        shopId: validatedOrder.shop.id,
        modifiers: selectedModifiers,
        use_cashback: useCashback,
        cashback_amount: useCashback ? cashbackAmount : 0,
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
        onError: () => {
          toast.error("Failed to create order. Please try again.");
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
                            -{formatPrice(cashbackAmount)}
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

              {/* Dashed separator */}
              <div className="border-t border-dashed border-gray-300 my-4" />

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
      </div>

      {/* Floating confirm bar — floats just above the bottom-nav pill and
          mirrors its rounded floating language, instead of the old full-width
          opaque bar the new glass nav overlapped. Outer is click-through in its
          margins so taps around the button still reach the content/nav. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] z-30 px-4">
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
