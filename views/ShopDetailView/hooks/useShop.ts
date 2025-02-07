import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ShopsApi } from "@/lib/domains/shops";

interface Location {
  lat: number;
  lng: number;
}

interface PhoneNumber {
  phoneNumber: string;
}

interface WorkingHours {
  weekDay: string;
  openAt: string;
  closeAt: string;
}

interface Picture {
  pictureUrl: string;
}

interface Url {
  urlType: string;
  url: string;
}

interface Drink {
  id: number;
  name: string;
  pictureUrl: string;
}

export interface ShopDetail {
  id: number;
  partnerId: number;
  name: string;
  pictureUrl: string;
  location: Location;
  phoneNumbers: PhoneNumber[] | null;
  workingHours: WorkingHours[] | null;
  pictures: Picture[] | null;
  urls: Url[] | null;
  drinks: Drink[];
}

type Params = {
  shopId: number;
};

const transformData = (shopDetail: ShopDetail | undefined) => {
  return {
    ...shopDetail,
    phoneNumbers: shopDetail?.phoneNumbers || [],
    workingHours: shopDetail?.workingHours || [],
    pictures: shopDetail?.pictures || [],
    urls: shopDetail?.urls || [],
  };
};

export function useShop(params: Params) {
  const { shopId } = params;
  const queryClient = useQueryClient();

  const {
    data: shopDetail,
    isLoading,
    isError,
  } = useQuery<ShopDetail>(
    {
      queryKey: ["shop-detail", shopId],
      queryFn: () => ShopsApi.getShop(shopId),
      staleTime: 300000, // 5 minutes
      enabled: Boolean(shopId),
    },
    queryClient
  );

  return {
    shopDetail: transformData(shopDetail),
    isLoading,
    isError,
  };
}
