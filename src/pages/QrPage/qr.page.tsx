import { Camera, Coffee } from "lucide-react";
import QRCode from "react-qr-code";
import { format } from "date-fns";
import { Badge, Button, Progress } from "@telegram-apps/telegram-ui";
import "swiper/css/pagination";
import "swiper/css";

import { Page } from "@/components/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/func/Loading";

import { useOrders } from "@/api/hooks/payments.hook";
import { useGetDrinksStat } from "@/api/hooks/subscriptions.hook";

import BgImage from "@/assets/images/bg_card.png";
import { useGetMe } from "@/api/hooks/profile.hook";
import { cn } from "@/helpers/utils";

const statusColors = {
  created: "bg-gray-400",
  pending: "bg-yellow-400",
  preparing: "bg-blue-400",
  completed: "bg-green-400",
  canceled: "bg-red-400",
};

export const QRPage = () => {
  const { orders } = useOrders();
  const { userInfo } = useGetMe();

  if (!userInfo) {
    return <LoadingScreen header="Loading..." description="Please wait..." />;
  }

  return (
    <Page>
      <div className="px-4 py-6 space-y-4">
        <div className="relative p-4 rounded-lg flex items-center h-full">
          <img
            src={BgImage}
            alt=""
            className="absolute top-0 left-0 rounded-lg max-h-[240px] min-h-[220px] w-full"
          />
          <div className="flex items-center justify-between relative w-full h-full">
            <div className="flex flex-col justify-between h-[180px] w-[180px] md:h-[200px] md:w-[200px] text-white">
              <h1 className="text-3xl font-bold font-eugusto">Hoopla</h1>
              {userInfo && (
                <div>
                  {userInfo.subscription && (
                    <p className="font-semibold text-2xl font-eugusto">
                      {userInfo.subscription.name}
                    </p>
                  )}
                  <p className="text-sm">+{userInfo.phoneNumber}</p>
                </div>
              )}
            </div>
            {userInfo && userInfo.qrCode && (
              <QRCode
                value={userInfo.qrCode}
                className="p-4 h-[180px] w-[180px] bg-white rounded-md"
              />
            )}
          </div>
        </div>
        <FloatingButton />
        {/* <CoffeeStatusSection /> */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Purchase History</h3>
          {orders && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div>
                  <div
                    key={order.id}
                    className="bg-[var(--tg-theme-bg-color)] p-4 rounded-lg shadow-md relative "
                  >
                    <p className="font-semibold text-lg">{order.partnerName}</p>
                    <p className="text-sm text-gray-600">
                      {format(
                        order.purchasedAtUnix * 1000,
                        "HH:mm, dd.MM.yyyy"
                      )}
                    </p>
                    <p className="text-sm">{order.shopName}</p>
                    <Badge
                      type="number"
                      className={cn(
                        "mt-2 absolute top-4 right-4 p-2",
                        statusColors[order.orderStatus]
                      )}
                    >
                      {order.orderStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <p className="text-sm text-gray-600">No orders found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

export function CoffeeStatusSection() {
  const { drinksStat } = useGetDrinksStat();

  if (!drinksStat)
    return <LoadingScreen header="Loading..." description="Please wait..." />;

  const percentage = Math.min(
    (drinksStat.left / drinksStat.available) * 100,
    100
  );
  const remaining = Math.max(drinksStat.available - drinksStat.left, 0);

  return (
    <section className="space-y-6">
      <Card className="bg-[var(--tg-theme-bg-color)] border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--tg-theme-text-color)]">
            <Coffee className="w-5 h-5 text-brown-600" />
            Daily Coffee Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm text-[var(--tg-theme-subtitle-text-color)]">
            <span>{drinksStat.left} drank</span>
            <span>{remaining} left</span>
          </div>
          <Progress value={percentage} />
        </CardContent>
      </Card>
    </section>
  );
}

export function FloatingButton() {
  return (
    <button
      type="button"
      onClick={() => console.log("Camera clicked")}
      className="fixed bottom-20 right-4 z-50 p-4 rounded-full bg-[var(--tg-theme-button-color)] shadow-lg transition-colors"
    >
      <Camera className="w-6 h-6" />
    </button>
  );
}
