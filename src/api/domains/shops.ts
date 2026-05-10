import { httpClient } from '@/api/http-client';

export interface Shop {
  shopId: number;
  partnerId: number;
  name: string;
  pictureUrl: string;
  distance: number;
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
