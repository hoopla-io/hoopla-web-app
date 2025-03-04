import { httpClient } from '@/lib/http/http-client';

export const ShopsApi = {
  getShops: async (lat: number, long: number, name: string = '') => {
    const response = await httpClient.get('/shops/near-shops', {
      params: { lat, long, name },
    });

    return response.data ?? [];
  },

  getShop: async (shopId: number) => {
    const response = await httpClient.get(`/shops/shop`, {
      params: { shopId },
    });

    return response.data;
  },
};
