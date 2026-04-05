import { httpClient } from '@/api/http-client';

export interface Banner {
  id: number;
  title: string | null;
  imageUrl: string;
  linkType: "partner" | "drink" | "url";
  linkValue: string;
}

export const BannersApi = {
  getMain: async () => {
    const response = await httpClient.get('/banners/main');
    return (response.data ?? []) as Banner[];
  },

  getByPartner: async (partnerId: number) => {
    const response = await httpClient.get(`/banners/partner/${partnerId}`);
    return (response.data ?? []) as Banner[];
  },
};
