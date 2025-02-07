"use client";

import ShopDetailView from "@/views/ShopDetailView";

export default function Page({ params }: { params: { shopId: string } }) {
  const { shopId } = params;
  return <ShopDetailView shopId={Number(shopId)} />;
}
