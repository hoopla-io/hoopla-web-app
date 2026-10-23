import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Loader2, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import {
  useBindCard,
  useBindCardStatus,
  useCards,
  useRemoveCard,
  type BankCard,
} from "@/api/hooks/cards.hook";
import { Page } from "@/components/Page";
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

const PS_LABELS: Record<string, string> = {
  uzcard: "Uzcard",
  humo: "Humo",
  visa: "Visa",
  mastercard: "Mastercard",
  unionpay: "UnionPay",
};

/** Rahmat's form session lives 15 minutes; stop waiting after that. */
const BIND_SESSION_MS = 15 * 60 * 1000;

const cardTitle = (card: BankCard): string => {
  const ps = PS_LABELS[card.ps?.toLowerCase()] ?? card.ps?.toUpperCase() ?? "";
  const last4 = card.cardPan?.slice(-4) ?? "";
  return [ps, last4 && `•••• ${last4}`].filter(Boolean).join(" ");
};

export const CardsPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cards, isLoading, isError } = useCards();
  const bind = useBindCard();
  const remove = useRemoveCard();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { bindStatus } = useBindCardStatus(sessionId);
  const [target, setTarget] = useState<BankCard | null>(null);

  useEffect(() => {
    if (!sessionId || !bindStatus || bindStatus.status === "pending") return;
    if (bindStatus.status === "active") {
      toast.success(t("cards.cardAdded"));
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    } else {
      toast.error(t("cards.addError"));
    }
    setSessionId(null);
  }, [sessionId, bindStatus, queryClient, t]);

  useEffect(() => {
    if (!sessionId) return;
    const id = setTimeout(() => setSessionId(null), BIND_SESSION_MS);
    return () => clearTimeout(id);
  }, [sessionId]);

  const handleAdd = () => {
    const tg = window.Telegram?.WebApp;
    const insideTelegram = !!tg?.initData && !!tg.openLink;
    // Open the tab inside the click so mobile browsers don't block it as a
    // popup; the form URL arrives after the request resolves.
    const tab = insideTelegram ? null : window.open("", "_blank");
    bind.mutate(undefined, {
      onSuccess: (session) => {
        if (insideTelegram) tg!.openLink!(session.formUrl);
        else if (tab) tab.location.href = session.formUrl;
        else window.open(session.formUrl, "_blank");
        setSessionId(session.sessionId);
      },
      onError: () => {
        tab?.close();
        toast.error(t("cards.addError"));
      },
    });
  };

  const handleRemove = () => {
    if (!target) return;
    remove.mutate(target.id, {
      onSuccess: () => {
        toast.success(t("cards.cardRemoved"));
        setTarget(null);
      },
      onError: () => toast.error(t("cards.removeError")),
    });
  };

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-28">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={t("cards.goBack")}
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {t("cards.title")}
          </h1>
        </div>
        <p className="text-sm text-gray-500 mb-4 px-1">{t("cards.subtitle")}</p>

        {/* Waiting for the Rahmat form */}
        {sessionId && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[var(--color-primary)]/10 p-4">
            <Loader2
              size={18}
              className="flex-shrink-0 animate-spin text-[var(--color-primary)]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t("cards.waitingTitle")}
              </p>
              <p className="text-xs text-gray-500">
                {t("cards.waitingDescription")}
              </p>
            </div>
            <button
              onClick={() => setSessionId(null)}
              className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              {t("common.cancel")}
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <CreditCard size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("cards.loadErrorTitle")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t("cards.loadErrorDescription")}
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <CreditCard size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("cards.emptyTitle")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t("cards.emptyDescription")}
            </p>
          </div>
        )}

        {/* List */}
        {!isLoading && !isError && cards.length > 0 && (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {cards.map((card) => {
              const title = cardTitle(card);
              return (
                <div key={card.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                    <CreditCard size={18} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {title}
                    </p>
                    {card.holderName && (
                      <p className="truncate text-xs text-gray-500">
                        {card.holderName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setTarget(card)}
                    className="flex-shrink-0 rounded-full p-2 text-red-500 transition-colors hover:bg-red-50"
                    aria-label={t("cards.removeCardAriaLabel", { name: title })}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add card */}
        {!isLoading && !isError && (
          <button
            onClick={handleAdd}
            disabled={bind.isPending || !!sessionId}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {bind.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Plus size={18} />
                {t("cards.addCard")}
              </>
            )}
          </button>
        )}
      </div>

      <AlertDialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cards.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cards.confirmDescription", {
                name: target ? cardTitle(target) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleRemove();
              }}
              disabled={remove.isPending}
            >
              {remove.isPending ? t("cards.removing") : t("cards.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};
