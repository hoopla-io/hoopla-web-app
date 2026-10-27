import { FC } from "react";
import { Check, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PaymentMethod } from "@/api/domains/payment";
import { cn } from "@/helpers/utils";

export function paymentMethodKey(method: PaymentMethod): string {
  if (method.type === "card") return `card:${method.id}`;
  if (method.type === "app") return `app:${method.method}`;
  return "page";
}

export function cardLast4(cardPan?: string): string {
  return (cardPan ?? "").slice(-4);
}

/**
 * Opens a payment app's link. Inside Telegram the link has to leave the Mini
 * App through openLink, which keeps our page alive — returns true so the caller
 * can poll; elsewhere the browser navigates away and Hoopla comes back through
 * the backend's return page.
 */
export function openPaymentLink(url: string): boolean {
  const tg = window.Telegram?.WebApp;
  if (tg?.initData && tg.openLink) {
    tg.openLink(url);
    return true;
  }

  window.location.href = url;
  return false;
}

interface Props {
  methods: PaymentMethod[];
  selected: string | null;
  onSelect: (key: string) => void;
}

export const PaymentMethodPicker: FC<Props> = ({ methods, selected, onSelect }) => {
  const { t } = useTranslation();

  const cards = methods.filter((method) => method.type !== "app");
  const apps = methods.filter((method) => method.type === "app");

  return (
    <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-3">
        <CreditCard size={20} className="shrink-0 text-gray-400" />
        <p className="font-medium text-gray-900">{t("payment.methodTitle")}</p>
      </div>

      <div className="space-y-2">
        {cards.map((method) => {
          const key = paymentMethodKey(method);
          const active = selected === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-semibold uppercase text-gray-600">
                {method.type === "card" ? method.ps : <CreditCard size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {method.type === "card"
                    ? t("payment.savedCard", { last4: cardLast4(method.cardPan) })
                    : t("payment.otherCard")}
                </p>
                {method.type === "page" && (
                  <p className="text-xs text-gray-500">{t("payment.otherCardHint")}</p>
                )}
              </div>
              {active && <Check size={18} className="shrink-0 text-[var(--color-primary)]" />}
            </button>
          );
        })}
      </div>

      {apps.length > 0 && (
        <>
          <p className="text-xs text-gray-500">{t("payment.orPayWithApp")}</p>
          <div className="flex flex-wrap gap-2">
            {apps.map((method) => {
              const key = paymentMethodKey(method);
              const active = selected === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-label={method.name}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border bg-white transition-colors",
                    active ? "border-2 border-[var(--color-primary)]" : "border-gray-200"
                  )}
                >
                  {method.logoUrl ? (
                    <img src={method.logoUrl} alt={method.name} className="h-10 w-10 object-contain" />
                  ) : (
                    <span className="px-1 text-[11px] font-semibold text-gray-700">{method.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
