import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Loader2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import type { UsualDrink } from "@/api/domains/orders";
import {
  useAddCartItem,
  useClearCart,
  isCrossShopCartConflict,
} from "@/api/hooks/cart.hook";
import { CartConflictDialog } from "@/components/func/CartConflictDialog";
import { cn, formatMoney } from "@/helpers/utils";

const unavailableReasonKeys: Record<string, string> = {
  shop_closed: "usualDrinks.shopClosed",
  product_stopped: "usualDrinks.productStopped",
  modifier_stopped: "usualDrinks.modifierStopped",
};

const drinkKey = (drink: UsualDrink) =>
  `${drink.shopId}:${drink.productId}:${drink.modifiers.map((m) => m.id).join(",")}`;

type Props = {
  drinks: UsualDrink[];
};

export const UsualDrinks: FC<Props> = ({ drinks }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addCartItem = useAddCartItem();
  const clearCart = useClearCart();
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [pendingDrink, setPendingDrink] = useState<UsualDrink | null>(null);

  if (drinks.length === 0) return null;

  const addToCart = (drink: UsualDrink) => {
    setAddingKey(drinkKey(drink));
    addCartItem.mutate(
      {
        shopId: drink.shopId,
        drinkId: drink.productId,
        quantity: drink.quantity,
        modifiers: drink.modifiers.map((modifier) => ({
          modifierGroupId: "",
          modifierId: String(modifier.id),
          modifierKey: "",
          modifierPrice: modifier.price,
          modifierName: modifier.name,
        })),
      },
      {
        onSuccess: () => toast.success(t("shopDetail.addedToCart")),
        onError: (err: any) => {
          if (isCrossShopCartConflict(err)) {
            setPendingDrink(drink);
            return;
          }
          toast.error(
            err?.message ??
              err?.response?.data?.message ??
              t("shopDetail.addToCartError")
          );
        },
        onSettled: () => setAddingKey(null),
      }
    );
  };

  const handleClearAndRetry = () => {
    if (!pendingDrink) return;
    clearCart.mutate(undefined, {
      onSuccess: () => {
        const drink = pendingDrink;
        setPendingDrink(null);
        addToCart(drink);
      },
      onError: () => toast.error(t("shopDetail.clearCartError")),
    });
  };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        {t("usualDrinks.title")}
      </h2>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {drinks.map((drink) => {
          const key = drinkKey(drink);
          const isAdding = addingKey === key;
          const reason = drink.unavailableReason
            ? t(unavailableReasonKeys[drink.unavailableReason] ?? "usualDrinks.unavailable")
            : null;

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/shops/${drink.shopId}`)}
              className="flex w-[260px] flex-shrink-0 cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 transition-transform active:scale-[0.99]"
            >
              {drink.productImageUrl ? (
                <img
                  src={drink.productImageUrl}
                  alt={drink.productName}
                  className={cn(
                    "h-16 w-16 flex-shrink-0 rounded-xl bg-gray-100 object-cover",
                    !drink.available && "opacity-50 grayscale"
                  )}
                />
              ) : (
                <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-xl bg-gray-100">
                  <Coffee size={24} className="text-gray-400" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {drink.quantity > 1 ? `${drink.quantity} × ` : ""}
                  {drink.productName}
                </h3>
                {drink.modifiers.length > 0 && (
                  <p className="truncate text-xs text-gray-500">
                    {drink.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                <p className="truncate text-xs text-gray-500">{drink.shopName}</p>
                {reason ? (
                  <p className="mt-1 truncate text-xs font-medium text-red-500">{reason}</p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatMoney(drink.totalAmount, t)}
                  </p>
                )}
              </div>

              <button
                type="button"
                aria-label={t("usualDrinks.add")}
                disabled={!drink.available || addingKey !== null}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(drink);
                }}
                className="grid h-9 w-9 flex-shrink-0 place-items-center self-end rounded-full bg-[var(--color-primary)] text-white transition-transform active:scale-90 disabled:bg-gray-200 disabled:text-gray-400"
              >
                {isAdding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <CartConflictDialog
        open={pendingDrink !== null}
        onOpenChange={(open) => !open && setPendingDrink(null)}
        onConfirm={handleClearAndRetry}
        isPending={clearCart.isPending}
      />
    </div>
  );
};
