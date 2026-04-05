import { httpClient } from '@/api/http-client';

export interface StoryGroup {
  id: number;
  title: string;
  coverImageUrl: string;
  isSeen: boolean;
}

export interface StoryItem {
  id: number;
  title: string | null;
  description: string | null;
  imageUrl: string;
  linkType: "partner" | "drink" | "url" | null;
  linkValue: string | null;
  duration: number;
}

export interface StoryDetail {
  id: number;
  title: string;
  coverImageUrl: string;
  items: StoryItem[];
}

export const StoriesApi = {
  getList: async () => {
    const response = await httpClient.get('/stories/list');
    return (response.data ?? []) as StoryGroup[];
  },

  getById: async (id: number) => {
    const response = await httpClient.get(`/stories/show/${id}`);
    return response.data as StoryDetail;
  },
};
