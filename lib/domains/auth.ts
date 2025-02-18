import { httpClient } from '@/lib/http/http-client';

export interface LoginResponse {
  phoneNumber: string;
  sessionId: string;
  sessionExpiresAt: number;
  sessionExpireAtMs: number;
}

interface JWT {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresAtMs: number;
}

export interface ConfirmSmsResponse {
  userId: number;
  phoneNumber: string;
  isNewUser: boolean;
  jwt: JWT;
}

interface User {
  userId: number;
  phoneNumber: string;
  name: string;
  balance: number;
  currency: 'uzs' | 'usd';
  subscription: {
    id: number;
    name: string;
  };
}
export const AuthApi = {
  login: async (phoneNumber: string) => {
    const response = await httpClient.post('/auth/login', {
      phoneNumber,
    });

    return response.data as LoginResponse;
  },

  confirmSms: async (sessionId: string, code: number) => {
    const response = await httpClient.post(`/auth/confirm-sms`, {
      sessionId,
      code,
    });

    return response.data as ConfirmSmsResponse;
  },

  logout: async () => {
    await httpClient.post('/user/logout');
  },

  getUser: async () => {
    const response = await httpClient.get('/user/get-me');

    return response.data as User;
  },

  getQrCode: async () => {
    const response = await httpClient.get('/user/generate-qr-code');

    return response.data;
  },

  getOrdersHistory: async () => {
    const response = await httpClient.get('/user/orders-history');

    return response.data;
  },
};
