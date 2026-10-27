import { httpClient } from '@/api/http-client';

interface PaymentSystem {
  id: number;
  name: string;
  logoUrl: string;
}

/**
 * One way to pay, as GET /user/pay/methods lists them: saved cards first, then
 * payment apps, then (orders only) Rahmat's own page for a card not saved yet.
 */
export interface PaymentMethod {
  type: 'card' | 'app' | 'page';
  /** Saved card id (type card). */
  id?: number;
  /** Payment app code, e.g. "uzum" (type app). */
  method?: string;
  name: string;
  cardPan?: string;
  ps?: string;
  logoUrl?: string;
}

export interface RahmatTopUp {
  paymentId: string;
  /** draft until confirmed or paid in the app; success once credited. */
  status: string;
  /** The card holder got an SMS code to send to the confirm endpoint. */
  otpRequired: boolean;
  phone?: string;
  cardPan?: string;
  /** Payment app link to open (app top-ups only). */
  checkoutUrl?: string;
  amount: number;
}

export type RahmatTopUpRequest =
  | { amount: number; cardId: number }
  | { amount: number; paymentMethod: string };

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

  getMethods: async (purpose: 'order' | 'top_up') => {
    const response: any = await httpClient.get('/user/pay/methods', {
      params: { purpose },
    });

    return (response.data ?? []) as PaymentMethod[];
  },

  rahmatTopUp: async (data: RahmatTopUpRequest) => {
    // A saved card without an SMS code is charged before this answers.
    const response: any = await httpClient.post('/user/pay/rahmat-top-up', data, {
      timeout: 35000,
    });

    return response.data as RahmatTopUp;
  },

  confirmRahmatTopUp: async (paymentId: string, otp: string) => {
    const response: any = await httpClient.post(
      `/user/pay/rahmat-top-up/${encodeURIComponent(paymentId)}/confirm`,
      { otp },
      { timeout: 35000 }
    );

    return response.data as RahmatTopUp;
  },

  getRahmatTopUp: async (paymentId: string) => {
    const response: any = await httpClient.get(
      `/user/pay/rahmat-top-up/${encodeURIComponent(paymentId)}`
    );

    return response.data as RahmatTopUp;
  },
};

export default PaymentApi;
