import { httpClient } from '@/lib/http/http-client';

interface PaymentSystem {
  id: number;
  name: string;
  logoUrl: string;
}

const PaymentApi = {
  getPaymentSystems: async () => {
    const response = await httpClient.get('/user/pay/services');

    return response.data as PaymentSystem[];
  },

  topUpViaPaymentSystem: async (id: number, amount: number) => {
    const response = await httpClient.get('/user/pay/top-up', {
      params: { id, amount },
    });

    return response.data;
  },
};

export default PaymentApi;
