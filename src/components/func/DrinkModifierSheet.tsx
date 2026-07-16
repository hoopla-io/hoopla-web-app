import { FC, useMemo, useState } from "react";
import { Check, Coffee, Loader2, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  useAddCartItem,
  useClearCart,
  isCrossShopCartConflict,
} from "@/api/hooks/cart.hook";
import { CartConflictDialog } from "@/components/func/CartConflictDialog";
import { formatBalance, cn } from "@/helpers/utils";
import {
  toSelectedModifier,
  type ValidateOrderResponse,
  type SelectedModifier,
  type ModifierGroup,
  type ModifierOption,
} from "@/api/domains/orders";

function formatPrice(price: number): string {
  return formatBalance(price) + " UZS";
}

/** A normalized group the UI renders, derived from new or legacy data. */
type WorkingGroup = {
  key: string;
  name: string;
  minSelect: number;
  maxSelect: number | null;
  options: ModifierOption[];
};

/**
 * Prefer the new `modifierGroups` (with names + rules). When absent, fall back
 * to the legacy `modifications` map and treat each group as "choose exactly
 * one" so behavior is unchanged until the backend sends group rules.
 */
function buildGroups(vo: ValidateOrderResponse): WorkingGroup[] {
  if (vo.modifierGroups && vo.modifierGroups.length > 0) {
    return vo.modifierGroups
      .filter((g) => Array.isArray(g.options) && g.options.length > 0)
      .map((g: ModifierGroup) => ({
        key: g.key,
        name: g.name || g.key,
        minSelect: g.minSelect ?? 0,
        maxSelect: g.maxSelect ?? null,
        options: g.options,
      }));
  }

  const mods = vo.modifications ?? {};
  return Object.keys(mods)
    .filter((k) => Array.isArray(mods[k]) && mods[k].length > 0)
    .map((k) => ({
      key: k,
      name: k,
      minSelect: 1,
      maxSelect: 1,
      options: mods[k] as ModifierOption[],
    }));
}

/** Short human label for a group's selection rule (e.g. "Required", "Pick 1–2"). */
function ruleLabel(min: number, max: number | null): string {
  if (min === 0 && max === null) return "Optional";
  if (min === 0 && max === 1) return "Optional";
  if (min === 0 && max != null) return `Up to ${max}`;
  if (min >= 1 && max === 1 && min === max) return "Required";
  if (min === max) return `Pick ${min}`;
  if (min >= 1 && max === null) return `At least ${min}`;
  return `Pick ${min}–${max}`;
}

interface DrinkModifierSheetProps {
  validatedOrder: ValidateOrderResponse | null; // null = sheet closed; non-null = open for that drink
  shopId: number;
  onClose: () => void; // call when the user dismisses the sheet WITHOUT adding (drag-down / backdrop / X)
  onAdded: () => void; // call after a SUCCESSFUL add-to-cart; parent will close the sheet + show its own toast
}

/**
 * Bottom-sheet modifier selector. Adds a quantity stepper and adds straight to
 * the cart on tap — the parent stays on the menu and closes the sheet itself.
 *
 * The Drawer stays mounted so vaul can animate open/close; the sheet's body
 * (all the per-drink state) is a separate component keyed on the drink id so
 * it remounts — and resets — fresh every time a different drink opens.
 */
export const DrinkModifierSheet: FC<DrinkModifierSheetProps> = ({
  validatedOrder,
  shopId,
  onClose,
  onAdded,
}) => {
  const open = validatedOrder != null;

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DrawerContent className="max-h-[92dvh]">
        <DrawerTitle className="sr-only">
          {validatedOrder?.drink.name ?? "Customize drink"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Choose modifiers and quantity, then add this drink to your cart.
        </DrawerDescription>
        {validatedOrder && (
          <DrinkModifierSheetBody
            key={validatedOrder.drink.id}
            validatedOrder={validatedOrder}
            shopId={shopId}
            onAdded={onAdded}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
};

interface DrinkModifierSheetBodyProps {
  validatedOrder: ValidateOrderResponse;
  shopId: number;
  onAdded: () => void;
}

const DrinkModifierSheetBody: FC<DrinkModifierSheetBodyProps> = ({
  validatedOrder,
  shopId,
  onAdded,
}) => {
  const addCartItem = useAddCartItem();
  const clearCart = useClearCart();
  const [showCartConflict, setShowCartConflict] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const groups = useMemo(() => buildGroups(validatedOrder), [validatedOrder]);

  // Selection is an array per group key (supports multi-select). Required
  // single-option groups are pre-selected since there's nothing to decide.
  const [selected, setSelected] = useState<Record<string, SelectedModifier[]>>(
    () => {
      const init: Record<string, SelectedModifier[]> = {};
      for (const g of groups) {
        if (g.options.length === 1 && g.minSelect >= 1) {
          init[g.key] = [toSelectedModifier(g.options[0], g.key)];
        }
      }
      return init;
    }
  );

  const toggleOption = (group: WorkingGroup, option: ModifierOption) => {
    const id = String(option.modificationId ?? "");
    const isSingle = group.maxSelect === 1;

    setSelected((prev) => {
      const current = prev[group.key] ?? [];
      const exists = current.some((m) => m.modifierId === id);

      if (isSingle) {
        // Radio: re-tapping clears only when the group is optional.
        if (exists) {
          return group.minSelect >= 1
            ? prev
            : { ...prev, [group.key]: [] };
        }
        return { ...prev, [group.key]: [toSelectedModifier(option, group.key)] };
      }

      // Multi-select: toggle off, or add while under the max.
      if (exists) {
        return {
          ...prev,
          [group.key]: current.filter((m) => m.modifierId !== id),
        };
      }
      if (group.maxSelect != null && current.length >= group.maxSelect) {
        return prev; // at the cap — ignore
      }
      return { ...prev, [group.key]: [...current, toSelectedModifier(option, group.key)] };
    });
  };

  const isGroupValid = (group: WorkingGroup) => {
    const count = (selected[group.key] ?? []).length;
    return (
      count >= group.minSelect &&
      (group.maxSelect == null || count <= group.maxSelect)
    );
  };

  const allGroupsValid = groups.every(isGroupValid);

  const selectedModifiers = Object.values(selected).flat();
  const modifiersTotal = selectedModifiers.reduce(
    (sum, m) => sum + (m.modifierPrice ?? 0),
    0
  );
  const unitTotal = validatedOrder.drink.amount + modifiersTotal;

  const doAddToCart = () => {
    addCartItem.mutate(
      {
        shopId,
        drinkId: validatedOrder.drink.id,
        quantity,
        modifiers: selectedModifiers,
      },
      {
        onSuccess: () => {
          onAdded();
        },
        onError: (err: any) => {
          if (isCrossShopCartConflict(err)) {
            setShowCartConflict(true);
            return;
          }
          toast.error(
            err?.message ??
              err?.response?.data?.message ??
              "Couldn't add this to your cart. Please try again."
          );
        },
      }
    );
  };

  const handleAdd = () => {
    if (!allGroupsValid) return;
    doAddToCart();
  };

  // Cross-shop conflict: the customer already has an active cart at a
  // different shop. Clearing it and retrying is an explicit, confirmed step —
  // never automatic — so they don't lose another cart's contents by accident.
  const handleClearAndRetry = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => {
        setShowCartConflict(false);
        doAddToCart();
      },
      onError: () => {
        toast.error("Couldn't clear your existing cart. Please try again.");
      },
    });
  };

  return (
    <>
      {/* Scrollable body: drink banner + modifier groups */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1">
        {/* Drink — banner image, name + price under it */}
        <div className="pb-1">
          {validatedOrder.drink.imageUrl ? (
            <img
              src={validatedOrder.drink.imageUrl}
              alt={validatedOrder.drink.name}
              className="h-44 w-full rounded-2xl object-cover shadow-sm ring-1 ring-black/[0.06]"
            />
          ) : (
            <div className="grid h-44 w-full place-items-center rounded-2xl bg-gray-100 text-gray-300 ring-1 ring-black/[0.06]">
              <Coffee size={40} />
            </div>
          )}
          <div className="pt-3">
            <h2 className="truncate text-lg font-bold text-gray-900">
              {validatedOrder.drink.name}
            </h2>
            <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-primary)]">
              {formatPrice(validatedOrder.drink.amount)}
            </p>
          </div>
        </div>

        {/* Modifier Groups */}
        <div className="space-y-7 pb-4 pt-6">
          {groups.map((group) => {
            const count = (selected[group.key] ?? []).length;
            const atMax =
              group.maxSelect != null && count >= group.maxSelect;
            const needsMore = count < group.minSelect;
            const isSingle = group.maxSelect === 1;

            return (
              <div key={group.key}>
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    {group.name}
                  </h2>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      needsMore
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {ruleLabel(group.minSelect, group.maxSelect)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {group.options.map((option, idx: number) => {
                    // Identity must match what's stored (toSelectedModifier
                    // uses ?? ""), so the highlight can't desync if an id is
                    // ever missing; the React key stays unique via the index.
                    const modId = String(option.modificationId ?? "");
                    const isSelected = (selected[group.key] ?? []).some(
                      (m) => m.modifierId === modId
                    );
                    // In multi-select, dim options once the cap is reached.
                    const isDisabled = !isSelected && !isSingle && atMax;

                    return (
                      <button
                        key={`${group.key}-${idx}`}
                        onClick={() => toggleOption(group, option)}
                        disabled={isDisabled}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                          isSelected
                            ? "bg-[var(--color-primary)]/[0.06] ring-2 ring-[var(--color-primary)]"
                            : "bg-white shadow-[0_2px_10px_-6px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06]",
                          isDisabled && "opacity-40"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "grid h-6 w-6 shrink-0 place-items-center transition-colors",
                              // Round = pick one; rounded square = pick many.
                              isSingle ? "rounded-full" : "rounded-md",
                              isSelected
                                ? "bg-[var(--color-primary)]"
                                : "ring-2 ring-gray-300"
                            )}
                          >
                            {isSelected && (
                              <Check size={14} className="text-white" />
                            )}
                          </span>
                          <span
                            className={cn(
                              "truncate text-[15px] font-medium",
                              isSelected ? "text-gray-900" : "text-gray-700"
                            )}
                          >
                            {option.modificationName ?? `Option ${idx + 1}`}
                          </span>
                        </div>
                        {(option.modificationPrice ?? 0) > 0 && (
                          <span
                            className={cn(
                              "shrink-0 text-sm font-semibold",
                              isSelected
                                ? "text-[var(--color-primary)]"
                                : "text-gray-500"
                            )}
                          >
                            +{formatPrice(option.modificationPrice)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom action bar — quantity stepper + Add button */}
      <div className="shrink-0 border-t border-black/[0.06] bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px)+var(--tg-bottom-inset,0px))] pt-3">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--color-primary)] shadow-sm transition-colors active:bg-gray-100 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="w-6 text-center text-[15px] font-semibold text-gray-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary)] text-white shadow-sm transition-colors active:bg-[var(--color-primary-dark)]"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            onClick={handleAdd}
            disabled={!allGroupsValid || addCartItem.isPending}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white transition-all active:scale-[0.99]",
              allGroupsValid && !addCartItem.isPending
                ? "bg-[var(--color-primary)] shadow-[0_12px_30px_-8px_rgba(141,11,65,0.55)] active:bg-[var(--color-primary-dark)]"
                : "cursor-not-allowed bg-gray-300"
            )}
          >
            {addCartItem.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Adding...
              </>
            ) : (
              `Add · ${formatPrice(unitTotal * quantity)}`
            )}
          </button>
        </div>
      </div>

      <CartConflictDialog
        open={showCartConflict}
        onOpenChange={setShowCartConflict}
        onConfirm={handleClearAndRetry}
        isPending={clearCart.isPending}
      />
    </>
  );
};
