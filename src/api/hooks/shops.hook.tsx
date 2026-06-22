import { useMemo } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
  ShopsApi,
  type Shop,
  type ShopDrinksResponse,
  type ShopDrinkCategory,
  type ShopDrink,
} from "@/api/domains/shops";

type Params = {
  name?: string;
  latitude?: number;
  longitude?: number;
  categoryId?: number;
};

const ITEMS_PER_PAGE = 10;

export function useShops(params: Params) {
  const { name = "", latitude = 41.2995, longitude = 69.2401, categoryId } = params;
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
      queryKey: ["shops", latitude, longitude, name, categoryId],
      queryFn: async ({ pageParam = 0 }) => {
        const allShops = await ShopsApi.getShops(
          Number(latitude),
          Number(longitude),
          name,
          categoryId
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

/**
 * Returns EVERY nearby shop in one shot (no pagination) — used by the map, which
 * must plot all pins at once. `useShops` paginates for the infinite-scroll list,
 * so on the map it would only ever surface the first page of markers.
 */
export function useAllShops(params: Params) {
  const { name = "", latitude = 41.2995, longitude = 69.2401, categoryId } = params;
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Shop[]>(
    {
      queryKey: ["shops-all", latitude, longitude, name, categoryId],
      queryFn: () =>
        ShopsApi.getShops(Number(latitude), Number(longitude), name, categoryId),
      staleTime: 300000,
    },
    queryClient
  );

  // Stable reference so consumers' effects don't re-run on every render.
  const shops = useMemo(() => data ?? [], [data]);

  return { shops, isLoading, isError };
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

export function useShopDrinks(shopId: number) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
  } = useQuery<ShopDrinksResponse>(
    {
      queryKey: ["shop-drinks", shopId],
      queryFn: () => ShopsApi.getShopDrinks(shopId),
      staleTime: 300000,
      enabled: Boolean(shopId),
    },
    queryClient
  );

  return {
    categories: data?.categories ?? [],
    isLoading,
    isError,
  };
}

export type { ShopDrink, ShopDrinkCategory };
