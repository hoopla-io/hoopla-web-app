import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { ShopsApi, type Shop } from "@/api/domains/shops";

type Params = {
  name?: string;
  latitude?: number;
  longitude?: number;
};

const ITEMS_PER_PAGE = 10;

export function useShops(params: Params) {
  const { name = "", latitude = 41.2995, longitude = 69.2401 } = params;
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Shop[]>(
    {
      queryKey: ["shops", latitude, longitude, name],
      queryFn: async ({ pageParam = 0 }) => {
        const allShops = await ShopsApi.getShops(
          Number(latitude),
          Number(longitude),
          name
        );
        const start = (pageParam as number) * ITEMS_PER_PAGE;
        return allShops.slice(start, start + ITEMS_PER_PAGE);
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < ITEMS_PER_PAGE) return undefined;
        return allPages.length;
      },
      initialPageParam: 0,
      staleTime: 300000,
    },
    queryClient
  );

  const shops = data?.pages.flat() ?? [];

  return {
    shops,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

export type { Shop };

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
  productPrice: number;
  categoryName: string | null;
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
      staleTime: 300000,
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
