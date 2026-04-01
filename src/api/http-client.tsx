import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosResponse } from "axios";

export const extractorResponseInterceptor = (response: AxiosResponse) => {
  return Object.assign(response, response.data);
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

const redirectToLogin = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  const currentPath = window.location.hash.replace("#", "") || "/";
  window.location.hash = `/login?redirect=${currentPath}`;
};

export const applyExtractorResponseInterceptor = (
  axiosInstance: AxiosInstance
) => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return extractorResponseInterceptor(response);
    },
    async (error: AxiosError) => {
      const originalRequest = error.config;

      if (error.response?.status === 412 && originalRequest) {
        const refreshToken = localStorage.getItem("refresh_token");

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
                resolve(axios(originalRequest));
              },
              reject: (err: unknown) => {
                reject(err);
              },
            });
          });
        }

        isRefreshing = true;

        try {
          // Use a plain axios call to avoid the request interceptor attaching the expired token
          const { data } = await axios.patch(
            `${import.meta.env.VITE_API_URL}/user/refresh-token?refreshToken=${refreshToken}`
          );
          localStorage.setItem("access_token", data.accessToken);
          localStorage.setItem("refresh_token", data.refreshToken);

          // Retry all queued requests with the new token
          processQueue(null, data.accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          redirectToLogin();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (error.response?.status === 401) {
        redirectToLogin();
        return Promise.reject(error);
      }

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
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
