import { FC, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import { ArrowLeft, Check, Maximize2, X, Coffee } from "lucide-react";

import { Page } from "@/components/Page";
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

/** Short human label for a group's selection rule. */
function ruleLabel(min: number, max: number | null): string {
  if (min === 0 && max === null) return "Optional";
  if (min === 0 && max === 1) return "Optional";
  if (min === 0 && max != null) return `Up to ${max}`;
  if (min >= 1 && max === 1 && min === max) return "Required";
  if (min === max) return `Pick ${min}`;
  if (min >= 1 && max === null) return `At least ${min}`;
  return `Pick ${min}–${max}`;
}

export const ModifierSelectionPage: FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const validatedOrder = (location.state as any)
    ?.validatedOrder as ValidateOrderResponse | undefined;

  const groups = useMemo(
    () => (validatedOrder ? buildGroups(validatedOrder) : []),
    [validatedOrder]
  );

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
  const [comment, setComment] = useState("");
  const [imageOpen, setImageOpen] = useState(false);

  if (!validatedOrder) {
    return <Navigate to={`/shops/${shopId}`} replace />;
  }

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
  const totalPrice = validatedOrder.drink.amount + modifiersTotal;

  const handleContinue = () => {
    if (!allGroupsValid) return;
    navigate(`/shops/${shopId}/order/receipt`, {
      state: {
        validatedOrder,
        selectedModifiers,
        // Pass the note forward so the receipt knows it was handled here and
        // doesn't render its own textarea.
        comment: comment.trim(),
      },
      replace: true,
    });
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
          <h1 className="text-lg font-bold text-gray-900">Customize</h1>
        </div>

        {/* Drink — compact square thumbnail, tap to expand */}
        <div className="mx-4 flex items-center gap-3.5">
          {validatedOrder.drink.imageUrl ? (
            <button
              type="button"
              onClick={() => setImageOpen(true)}
              className="relative shrink-0 transition-transform active:scale-[0.97]"
            >
              <img
                src={validatedOrder.drink.imageUrl}
                alt={validatedOrder.drink.name}
                className="h-[72px] w-[72px] rounded-2xl object-cover shadow-sm ring-1 ring-black/[0.06]"
              />
              <span className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                <Maximize2 size={11} />
              </span>
            </button>
          ) : (
            <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-2xl bg-gray-100 text-gray-400 ring-1 ring-black/[0.06]">
              <Coffee size={24} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-gray-900">
              {validatedOrder.drink.name}
            </h2>
            <p className="truncate text-sm text-gray-500">
              {validatedOrder.shop.name}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--color-primary)]">
              {formatPrice(validatedOrder.drink.amount)}
            </p>
          </div>
        </div>

        {/* Modifier Groups */}
        <div className="px-4 pt-6 space-y-7">
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

        {/* Note to barista — lives here (not on the receipt) because this drink
            has modifiers, so the note is captured alongside the choices. */}
        <div className="px-4 pt-7">
          <label
            htmlFor="order-comment"
            className="mb-2 block px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-gray-500"
          >
            Note to barista{" "}
            <span className="font-normal normal-case tracking-normal text-gray-400">
              (optional)
            </span>
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
      </div>

      {/* Floating action bar — mirrors the receipt's floating pill so it sits
          above the glass bottom-nav instead of overlapping it. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+var(--tg-bottom-inset,0px)+5.75rem)] z-30 px-4">
        <div className="pointer-events-auto mx-auto max-w-lg">
          <button
            onClick={handleContinue}
            disabled={!allGroupsValid}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition-all active:scale-[0.99]",
              allGroupsValid
                ? "bg-[var(--color-primary)] shadow-[0_12px_30px_-8px_rgba(141,11,65,0.55)] active:bg-[var(--color-primary-dark)]"
                : "cursor-not-allowed bg-gray-300"
            )}
          >
            Continue · {formatPrice(totalPrice)}
          </button>
        </div>
      </div>

      {/* Expanded drink image */}
      {imageOpen && validatedOrder.drink.imageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImageOpen(false)}
        >
          <button
            onClick={() => setImageOpen(false)}
            className="absolute right-4 top-[calc(1rem+var(--tg-top-inset,0px))] grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <X size={22} />
          </button>
          <img
            src={validatedOrder.drink.imageUrl}
            alt={validatedOrder.drink.name}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Page>
  );
};
