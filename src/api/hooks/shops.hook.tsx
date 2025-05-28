import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ShopsApi } from "@/api/domains/shops";

type Module = {
  moduleId: number;
  name: "Lite" | "Pro";
  colour: string;
};

interface Shop {
  shopId: number;
  partnerId: number;
  name: string;
  pictureUrl: string;
  distance: number;
  location: {
    lat: number;
    lng: number;
  };
  modules: Module[];
}

type Params = {
  name?: string;
  latitude?: number;
  longitude?: number;
};

export function useShops(params: Params) {
  const { name = "", latitude = 1, longitude = 1 } = params;
  const queryClient = useQueryClient();

  const {
    data: shops = [],
    isLoading,
    isError,
  } = useQuery<Shop[]>(
    {
      queryKey: ["shops", latitude, longitude, name],
      queryFn: () =>
        ShopsApi.getShops(Number(latitude), Number(longitude), name),
      staleTime: 300000, // 5 minutes
      // enabled: Boolean(location?.latitude && location?.longitude),
    },
    queryClient
  );

  return {
    shops,
    isLoading,
    isError,
  };
}

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

type ShopDetailParams = {
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

export function useShop(params: ShopDetailParams) {
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
