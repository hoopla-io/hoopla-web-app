import { FC, useEffect, useState } from "react";
import { Download, Instagram, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { canShareFile, orderStoryFile, renderOrderStory } from "@/helpers/order-story";
import type { OrderDetail } from "@/api/domains/orders";

interface OrderStorySheetProps {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderStorySheet: FC<OrderStorySheetProps> = ({ order, open, onOpenChange }) => {
  const { t, i18n } = useTranslation();
  const [story, setStory] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let url: string | null = null;

    renderOrderStory(order)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setStory({ file: orderStoryFile(blob, order.id), url });
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t("orderStory.renderFailed"));
        onOpenChange(false);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setStory(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order.id, i18n.language]);

  const shareable = !!story && canShareFile(story.file);
  const insideTelegram = !!window.Telegram?.WebApp?.initData;

  const handleShare = async () => {
    if (!story) return;
    try {
      await navigator.share({ files: [story.file] });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      toast.error(t("orderStory.shareFailed"));
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[94dvh]">
        <DrawerTitle className="sr-only">{t("orderStory.title")}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("orderStory.description")}
        </DrawerDescription>

        <div className="relative mx-auto flex w-full max-w-lg flex-col items-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+var(--tg-bottom-inset,0px)+1.25rem)] pt-1">
          <button
            aria-label={t("common.close")}
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-0 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
          >
            <X size={16} />
          </button>

          <h2 className="mb-3 pt-1 text-center text-lg font-bold text-gray-900">
            {t("orderStory.title")}
          </h2>

          <div className="grid aspect-[9/16] h-[min(56dvh,30rem)] place-items-center overflow-hidden rounded-3xl bg-[var(--color-primary)] shadow-[0_18px_40px_-12px_rgba(141,11,65,0.55)]">
            {story ? (
              <img
                src={story.url}
                alt={t("orderStory.title")}
                className="h-full w-full object-cover"
              />
            ) : (
              <Loader2 className="h-7 w-7 animate-spin text-white/80" />
            )}
          </div>

          <div className="mt-4 w-full space-y-2">
            {shareable && (
              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white transition-all active:scale-[0.99] active:bg-[var(--color-primary-dark)]"
              >
                <Instagram size={19} />
                {t("orderStory.share")}
              </button>
            )}
            {story && !insideTelegram && (
              <a
                href={story.url}
                download={story.file.name}
                className={
                  shareable
                    ? "flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 py-3.5 text-base font-semibold text-gray-800 transition-all active:scale-[0.99]"
                    : "flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white transition-all active:scale-[0.99]"
                }
              >
                <Download size={19} />
                {t("orderStory.save")}
              </a>
            )}
            {story && (
              <p className="px-2 pt-1 text-center text-xs text-gray-400">
                {shareable ? t("orderStory.shareHint") : t("orderStory.saveHint")}
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
