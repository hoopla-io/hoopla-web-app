import { FC, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useNotifications, useMarkNotificationsRead } from "@/api/hooks/notifications.hook";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";
import { useAuth } from "@/context/auth.context";

export const NotificationsPage: FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const {
    notifications,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const { markRead } = useMarkNotificationsRead();
  const observerRef = useRef<HTMLDivElement>(null);

  // The list/detail endpoints are public; only mark-read needs auth, so guard
  // it to avoid triggering the sign-in drawer for logged-out visitors.
  useEffect(() => {
    if (isAuthenticated) markRead();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <LoadingScreen
        header={t("notifications.loadingHeader")}
        description={t("common.pleaseWait")}
      />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto px-4 pt-2 pb-28">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          {t("notifications.title")}
        </h1>

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("notifications.emptyTitle")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t("notifications.emptyDescription")}
            </p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Link
                key={n.notificationId}
                to={`/notifications/${n.notificationId}`}
              >
                <div className={`bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform mb-3 ${n.isNew ? "ring-2 ring-[var(--color-primary)]/30" : ""}`}>
                  {n.files?.imageUrl && (
                    <AspectRatio ratio={480 / 320}>
                      <img
                        src={n.files.imageUrl}
                        alt={n.notificationTitle}
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  )}
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold text-base text-gray-900 line-clamp-2 flex-1">
                        {n.notificationTitle}
                      </h3>
                      {n.isNew && (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {n.notificationDescription}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {n.createdAt}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            <div ref={observerRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};
