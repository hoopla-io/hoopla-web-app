import { FC, useState } from "react";
import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import { ArrowLeft, Check, Maximize2, X, Coffee } from "lucide-react";

import { Page } from "@/components/Page";
import { formatBalance, cn } from "@/helpers/utils";
import type {
  ValidateOrderResponse,
  SelectedModifier,
} from "@/api/domains/orders";

function formatPrice(price: number): string {
  return formatBalance(price) + " UZS";
}

export const ModifierSelectionPage: FC = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const validatedOrder = (location.state as any)
    ?.validatedOrder as ValidateOrderResponse | undefined;

  const [selected, setSelected] = useState<Record<string, SelectedModifier>>(
    {}
  );
  const [comment, setComment] = useState("");
  const [imageOpen, setImageOpen] = useState(false);

  if (!validatedOrder) {
    return <Navigate to={`/shops/${shopId}`} replace />;
  }

  const modifications = validatedOrder.modifications ?? {};
  const modKeys = Object.keys(modifications).filter(
    (key) => Array.isArray(modifications[key]) && modifications[key].length > 0
  );

  const handleSelect = (
    groupKey: string,
    modifier: any
  ) => {
    setSelected((prev) => ({
      ...prev,
      [groupKey]: {
        modifierGroupId: String(modifier.modificationGroupId ?? groupKey),
        modifierId: String(modifier.modificationId ?? ""),
        modifierKey: String(modifier.modificationKey ?? groupKey),
        modifierPrice: modifier.modificationPrice ?? 0,
        modifierName: modifier.modificationName ?? "",
      },
    }));
  };

  const allGroupsSelected = modKeys.every((key) => selected[key]);

  const selectedModifiers = Object.values(selected);
  const modifiersTotal = selectedModifiers.reduce(
    (sum, m) => sum + (m.modifierPrice ?? 0),
    0
  );
  const totalPrice = validatedOrder.drink.amount + modifiersTotal;

  const handleContinue = () => {
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
          {modKeys.map((groupKey) => {
            const options = modifications[groupKey] as any[];

            return (
              <div key={groupKey}>
                <h2 className="mb-3 px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {groupKey}
                </h2>
                <div className="space-y-2.5">
                  {options.map((modifier: any, idx: number) => {
                    const modId = String(modifier.modificationId ?? idx);
                    const isSelected = selected[groupKey]?.modifierId === modId;

                    return (
                      <button
                        key={modId}
                        onClick={() => handleSelect(groupKey, modifier)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                          isSelected
                            ? "bg-[var(--color-primary)]/[0.06] ring-2 ring-[var(--color-primary)]"
                            : "bg-white shadow-[0_2px_10px_-6px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06]"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors",
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
                            {modifier.modificationName ?? `Option ${idx + 1}`}
                          </span>
                        </div>
                        {(modifier.modificationPrice ?? 0) > 0 && (
                          <span
                            className={cn(
                              "shrink-0 text-sm font-semibold",
                              isSelected
                                ? "text-[var(--color-primary)]"
                                : "text-gray-500"
                            )}
                          >
                            +{formatPrice(modifier.modificationPrice)}
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
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.75rem)] z-30 px-4">
        <div className="pointer-events-auto mx-auto max-w-lg">
          <button
            onClick={handleContinue}
            disabled={!allGroupsSelected}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold text-white transition-all active:scale-[0.99]",
              allGroupsSelected
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
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
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
