import { httpClient } from '@/api/http-client';

export interface Category {
  id: number;
  name: string;
  imageUrl: string | null;
}

export const CategoriesApi = {
  getList: async () => {
    const response = await httpClient.get('/categories/list');
    return (response.data ?? []) as Category[];
  },
};
