import { FC } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useNotificationDetail } from "@/api/hooks/notifications.hook";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Page } from "@/components/Page";
import { LoadingScreen } from "@/components/func/Loading";

export const NotificationDetailPage: FC = () => {
  const { notificationId } = useParams();
  const navigate = useNavigate();

  const { notification, isLoading } = useNotificationDetail(
    Number(notificationId)
  );

  if (isLoading || !notification) {
    return (
      <LoadingScreen
        header="Loading notification"
        description="Please wait..."
      />
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto pb-28">
        {/* Hero image */}
        {notification.files?.imageUrl && (
          <div className="relative">
            <AspectRatio ratio={480 / 320}>
              <img
                src={notification.files.imageUrl}
                alt={notification.notificationTitle}
                className="w-full h-full object-cover"
              />
            </AspectRatio>
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          </div>
        )}

        {!notification.files?.imageUrl && (
          <div className="px-4 pt-20">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
          </div>
        )}

        <div className="px-4 pt-4 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {notification.notificationTitle}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {notification.createdAt}
            </p>
          </div>

          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
            {notification.notificationDescription}
          </p>
        </div>
      </div>
    </Page>
  );
};
