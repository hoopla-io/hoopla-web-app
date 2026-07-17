import { httpClient } from '@/api/http-client';

export interface Shop {
  shopId: number;
  partnerId: number;
  name: string;
  pictureUrl: string;
  /** Square partner/brand logo, returned on every near-shops entry. */
  logoUrl: string;
  distance: number;
  /** Real-time availability from the list endpoint. */
  acceptingOrders?: boolean;
  /** ISO timestamp the shop is paused until, or null when not paused. */
  pausedUntil?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  modules: {
    moduleId: number;
    name: "Lite" | "Pro";
    colour: string;
  }[];
  workingHours?: {
    weekDay: string;
    openAt: string;
    closeAt: string;
  }[];
}

export interface ShopDrink {
  id: number;
  name: string;
  pictureUrl: string | null;
  productPrice: number;
  /** True when the drink is temporarily unavailable. Optional/absent on
   * older backends, in which case the drink is treated as in-stock. */
  outOfStock?: boolean;
}

export interface ShopDrinkCategory {
  id: number;
  name: string;
  drinks: ShopDrink[];
}

export interface ShopDrinksResponse {
  categories: ShopDrinkCategory[];
}

export const ShopsApi = {
  getShops: async (lat: number, long: number, name: string = '', categoryId?: number) => {
    const response = await httpClient.get('/shops/near-shops', {
      params: { lat, long, name, categoryId },
    });

    return (response.data ?? []) as Shop[];
  },

  getShop: async (shopId: number) => {
    const response = await httpClient.get(`/shops/shop`, {
      params: { shopId },
    });

    return response.data;
  },

  getShopDrinks: async (shopId: number) => {
    const response = await httpClient.get('/shops/drinks', {
      params: { shopId },
    });

    return (response.data ?? { categories: [] }) as ShopDrinksResponse;
  },
};
