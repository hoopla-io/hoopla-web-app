import type { ComponentType, JSX } from "react";

import { ProfilePage } from "@/pages/Profile/profile.page";
import { ShopsPage } from "@/pages/Shops/shops.page";
import { SubscriptionsPage } from "@/pages/Subscriptions/subscriptions.page";
import { LoginPage } from "@/pages/Login/login.page";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicy/privacy-policy.page";
import TermsOfUse from "@/pages/TermsOfUse/terms-of-use.page";
import { PaymentSystemsPage } from "@/pages/PaymentMethods/payment-methods.page";
import { QRPage } from "@/pages/QrPage/qr.page";
import { ShopDetailPage } from "@/pages/Shops/shops-detail.page";
import Invoice from "@/pages/Shops/invoice.page";

interface Route {
  path: string;
  Component?: ComponentType;
  title?: string;
  icon?: JSX.Element;
  protected?: boolean;
  element?: JSX.Element;
}

export const routes: Route[] = [
  { path: "/", Component: ShopsPage },
  {
    path: "/profile",
    protected: true,
    element: <ProfilePage />,
    title: "Profile",
  },
  {
    path: "/shops",
    Component: ShopsPage,
    title: "Shops",
  },
  {
    path: "/subscriptions",
    Component: SubscriptionsPage,
    title: "Subscriptions",
  },
  {
    path: "/login",
    Component: LoginPage,
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
    path: "/payment-methods",
    Component: PaymentSystemsPage,
  },
  {
    path: "/qr",
    protected: true,
    element: <QRPage />,
  },
  {
    path: "/shops/:shopId",
    Component: ShopDetailPage,
  },
  {
    path: "/invoice",
    element: <Invoice />,
  },
];
