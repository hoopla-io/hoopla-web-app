import { httpClient } from '@/lib/http/http-client';

interface Feature {
  id: number;
  feature: string;
}

interface Subscription {
  id: number;
  name: string;
  price: number;
  currency: string;
  days: number;
  features: Feature[];
}

const SubscriptionApi = {
  getSubscriptions: async () => {
    const response = await httpClient.get('/subscriptions');

    return response.data as Subscription[];
  },

  buySubscription: async (id: number) => {
    const response = await httpClient.post('/subscriptions/buy', {
      subscriptionId: id,
    });

    return response.data;
  },
};

export default SubscriptionApi;
