import axios from "axios";
import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/helpers/token-storage";
import { isTestModeEnabled } from "@/helpers/testMode";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _isRetry?: boolean;
}

export const extractorResponseInterceptor = (response: AxiosResponse) => {
  return { ...response, ...response.data };
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

export const AUTH_EXPIRED_EVENT = "auth:expired";

const redirectToLogin = () => {
  clearTokens();
  // Let the app prompt sign-in via the global drawer instead of navigating
  // to a separate page. AuthProvider listens for this event.
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
};

export const applyExtractorResponseInterceptor = (
  axiosInstance: AxiosInstance
) => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return extractorResponseInterceptor(response);
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | RetryableRequestConfig
        | undefined;

      // Handle token expiry (412) — refresh and retry once
      if (
        error.response?.status === 412 &&
        originalRequest &&
        !originalRequest._isRetry
      ) {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          redirectToLogin();
          return Promise.reject(error);
        }

        // If already refreshing, queue this request to retry after refresh completes
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                originalRequest._isRetry = true;
                resolve(axiosInstance(originalRequest));
              },
              reject: (err: unknown) => {
                reject(err);
              },
            });
          });
        }

        isRefreshing = true;

        try {
          // Use plain axios to avoid attaching the expired token via request
          // interceptor. NOTE: this also skips our response extractor, so
          // `body` is the full API envelope { code, message, data, meta } — the
          // tokens live under body.data, not on body itself.
          const { data: body } = await axios.patch(
            `${import.meta.env.VITE_API_URL}/user/refresh-token?refreshToken=${refreshToken}`
          );

          const accessToken: string | undefined = body?.data?.accessToken;
          const newRefreshToken: string | undefined = body?.data?.refreshToken;

          // Never retry with "Bearer undefined": a token-less refresh response
          // is treated as a failed refresh (→ caught below → sign-in prompt).
          if (!accessToken) {
            throw new Error("refresh-token response had no accessToken");
          }

          setTokens(accessToken, newRefreshToken ?? refreshToken);

          // Retry all queued requests with the new token
          processQueue(null, accessToken);

          // Retry the original request once
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          originalRequest._isRetry = true;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          redirectToLogin();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle unauthorized (401) — session is invalid, go to login
      if (error.response?.status === 401) {
        redirectToLogin();
        return Promise.reject(error);
      }

      // For all other errors, extract response data without mutating the original
      return Promise.reject(
        error.response ? extractorResponseInterceptor(error.response) : error
      );
    }
  );

  return axiosInstance;
};

export const applyAuthorizationInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Reveals type='test' partners/shops/orders to this client — the
      // backend hides them from every real customer unless this header is
      // present. Gated on the runtime test-mode toggle (hidden 5-tap gesture)
      // or the VITE_HOOPLA_TEST_MODE env override, so a normal customer build
      // never sends it. See helpers/testMode.ts.
      if (isTestModeEnabled()) {
        config.headers["X-Hoopla-Test"] = "true";
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return axiosInstance;
};

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000,
});

applyExtractorResponseInterceptor(httpClient);
applyAuthorizationInterceptor(httpClient);
