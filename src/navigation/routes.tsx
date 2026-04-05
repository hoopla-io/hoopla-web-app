import type { ComponentType, JSX } from "react";

import { ProfilePage } from "@/pages/Profile/profile.page";
import { LoginPage } from "@/pages/Login/login.page";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicy/privacy-policy.page";
import TermsOfUse from "@/pages/TermsOfUse/terms-of-use.page";
import { HomePage } from "@/pages/Home/home.page";
import { MapPage } from "@/pages/Map/map.page";
import { NotificationsPage } from "@/pages/Notifications/notifications.page";
import { NotificationDetailPage } from "@/pages/Notifications/notification-detail.page";
import { ShopDetailPage } from "@/pages/ShopDetail/shop-detail.page";
import { PartnerDetailPage } from "@/pages/PartnerDetail/partner-detail.page";
import { ModifierSelectionPage } from "@/pages/MakeOrder/modifier-selection.page";
import { OrderReceiptPage } from "@/pages/MakeOrder/order-receipt.page";
import { OrdersPage } from "@/pages/Orders/orders.page";
import { OrderDetailPage } from "@/pages/Orders/order-detail.page";

interface Route {
  path: string;
  Component?: ComponentType;
  title?: string;
  icon?: JSX.Element;
  protected?: boolean;
  element?: JSX.Element;
}

export const routes: Route[] = [
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/map",
    Component: MapPage,
    title: "Map",
  },
  {
    path: "/shops/:shopId",
    Component: ShopDetailPage,
  },
  {
    path: "/partners/:partnerId",
    Component: PartnerDetailPage,
  },
  {
    path: "/shops/:shopId/order/modifiers",
    protected: true,
    element: <ModifierSelectionPage />,
  },
  {
    path: "/shops/:shopId/order/receipt",
    protected: true,
    element: <OrderReceiptPage />,
  },
  {
    path: "/orders",
    protected: true,
    element: <OrdersPage />,
    title: "Orders",
  },
  {
    path: "/orders/:orderId",
    protected: true,
    element: <OrderDetailPage />,
  },
  {
    path: "/profile",
    protected: true,
    element: <ProfilePage />,
    title: "Profile",
  },
  {
    path: "/notifications",
    Component: NotificationsPage,
    title: "Notifications",
  },
  {
    path: "/notifications/:notificationId",
    Component: NotificationDetailPage,
  },
  {
    path: "/privacy-policy",
    Component: PrivacyPolicyPage,
  },
  {
    path: "/terms-of-use",
    Component: TermsOfUse,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
];
