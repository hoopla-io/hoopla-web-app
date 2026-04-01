import { FC, useState } from "react";
import { useParams, useNavigate, useLocation, Navigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";

import { Page } from "@/components/Page";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
      },
      replace: true,
    });
  };

  return (
    <Page>
      <div className="max-w-lg mx-auto pb-32">
        {/* Header */}
        <div className="relative">
          <AspectRatio ratio={480 / 280}>
            {validatedOrder.drink.imageUrl ? (
              <img
                src={validatedOrder.drink.imageUrl}
                alt={validatedOrder.drink.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-lg">No image</span>
              </div>
            )}
          </AspectRatio>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
        </div>

        <div className="px-4 pt-4 space-y-2">
          <h1 className="text-xl font-bold text-gray-900">
            {validatedOrder.drink.name}
          </h1>
          <p className="text-sm text-gray-500">{validatedOrder.shop.name}</p>
          <p className="text-base font-semibold text-[var(--color-primary)]">
            {formatPrice(validatedOrder.drink.amount)}
          </p>
        </div>

        {/* Modifier Groups */}
        <div className="px-4 pt-6 space-y-6">
          {modKeys.map((groupKey) => {
            const options = modifications[groupKey] as any[];

            return (
              <div key={groupKey}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-base font-semibold text-gray-900">
                    {groupKey}
                  </h2>
                </div>
                <div className="space-y-2">
                  {options.map((modifier: any, idx: number) => {
                    const modId = String(modifier.modificationId ?? idx);
                    const isSelected = selected[groupKey]?.modifierId === modId;

                    return (
                      <button
                        key={modId}
                        onClick={() => handleSelect(groupKey, modifier)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-colors",
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                            : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                              isSelected
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                                : "border-gray-300"
                            )}
                          >
                            {isSelected && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isSelected ? "text-gray-900" : "text-gray-700"
                            )}
                          >
                            {modifier.modificationName ?? `Option ${idx + 1}`}
                          </span>
                        </div>
                        {(modifier.modificationPrice ?? 0) > 0 && (
                          <span className="text-sm text-gray-500">
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
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-100 p-4 z-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <button
            onClick={handleContinue}
            disabled={!allGroupsSelected}
            className={cn(
              "w-full py-3.5 rounded-xl text-white font-semibold text-base transition-colors",
              allGroupsSelected
                ? "bg-[var(--color-primary)] active:bg-[var(--color-primary-dark)]"
                : "bg-gray-300 cursor-not-allowed"
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </Page>
  );
};
