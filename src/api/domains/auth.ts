import { httpClient } from "@/api/http-client";
import { getDeviceInfo } from "@/helpers/device";

export interface LoginResponse {
  phoneNumber: string;
  sessionId: string;
  sessionExpiresAt: number;
  sessionExpireAtMs: number;
}

export type OTPChannel = "sms" | "telegram";

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
  currency: string;
  subscription: {
    id: number;
    name: string;
    endDate: string;
    endDateUnix: number;
  } | null;
  unreadNotifications: number;
}
export const AuthApi = {
  login: async (phoneNumber: string, channel: OTPChannel) => {
    const response = await httpClient.post("/auth/login", {
      phoneNumber,
      channel,
    });

    return response.data as LoginResponse;
  },

  confirmSms: async (sessionId: string, code: number) => {
    const response = await httpClient.post(`/auth/confirm`, {
      sessionId,
      code: String(code),
      // Optional device fields — labels this session in the /user/devices list.
      // Omitting them is valid; we always send our best-effort values.
      ...getDeviceInfo(),
    });

    return response.data as ConfirmSmsResponse;
  },

  logout: async () => {
    await httpClient.post("/user/logout");
  },

  deleteAccount: async () => {
    await httpClient.delete("/user/deactivate");
  },

  getUser: async () => {
    const response = await httpClient.get("/user/get-me");

    return response.data as User;
  },

  getEditProfile: async () => {
    const response = await httpClient.get("/user/edit-me");
    return response.data as { name: string; dateOfBirth: string; gender: string };
  },

  updateProfile: async (data: { name?: string; gender?: string; dateOfBirth?: string }) => {
    const response = await httpClient.post("/user/update-me", data);
    return response.data;
  },

  getQrCode: async () => {
    const response = await httpClient.get("/user/generate-qr-code");

    return response.data;
  },

  getOrdersHistory: async () => {
    const response = await httpClient.get("/user/orders/orders-list");

    return response.data;
  },
};
